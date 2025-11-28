import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { MailerService } from 'src/common/mail/mail.service';
import { CrearCitaDto } from './dto/create-cita.dto';
import { SolicitarCitaDto } from './dto/solicitar-cita.dto';
import { ReprogSolicitadaPor, Rol, StatusCitaReprog, StatusCitas, StatusEvento } from 'src/common/enums';
import { ActualizarStatusCitaDto } from './dto/act-status-cita.dto';
import { ReprogramarCitaDto } from './dto/reprogramar-cita.dto';
import { ConsultarDisponibilidadDto } from './dto/consultar-disp.dto';
import { ResponderReprogramacionDto } from './dto/resp-reprog-cita.dto';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class CitaService {
    private logger = new Logger(CitaService.name);

    constructor (
        private prisma: PrismaService,
        private mailerService: MailerService
    ) {}

    // ============================================
    // DEFINICIÓN DE TRANSICIONES VÁLIDAS
    // ============================================
    private readonly TRANSICIONES_VALIDAS: Record<string, StatusCitas[]> = {
        [StatusCitas.PENDIENTE]: [StatusCitas.PROGRAMADA, StatusCitas.CANCELADA],
        [StatusCitas.PROGRAMADA]: [StatusCitas.COMPLETADA, StatusCitas.CANCELADA, StatusCitas.REPROGRAMADA],
        [StatusCitas.REPROGRAMADA]: [StatusCitas.PROGRAMADA, StatusCitas.CANCELADA],
        [StatusCitas.COMPLETADA]: [],
        [StatusCitas.CANCELADA]: []
    };

    // CREAR CITA (DENTISTA)
    async crearCita(dto: CrearCitaDto, id_consultorio: number) {
        // Validar que el paciente existe
        const paciente = await this.prisma.paciente.findUnique({
            where: { id_paciente: dto.id_paciente },
            include: { usuario: true }
        });

        if (!paciente) {
            throw new NotFoundException('Paciente no encontrado');
        }

        // Validar disponibilidad
        await this.validarDisponibilidad(dto.fecha, dto.hora_inicio, id_consultorio);

        // Crear cita con status "programada" directamente
        const cita = await this.prisma.cita.create({
            data: {
                id_paciente: dto.id_paciente,
                id_servicio: dto.id_servicio,
                fecha: new Date(dto.fecha),
                hora_inicio: new Date(`${dto.fecha}T${dto.hora_inicio}`),
                frecuencia: dto.frecuencia || 'unica',
                notas: dto.notas,
                id_consultorio,
                status: StatusCitas.PROGRAMADA
            },
            include: {
                paciente: { include: { usuario: true } },
                motivo_consulta: true,
                consultorio: true
            }
        });
        const { logoUrl, nombreDoc } = this.extraerDatosConsultorio(cita.consultorio);

         // Enviar correo sin bloquear operación principal
        this.enviarCorreoSeguro(() => 
            this.mailerService.enviarNotificacionCita(
                paciente.usuario.correo, 'programada',
                {
                    fecha: dto.fecha,
                    hora: dto.hora_inicio,
                },
                logoUrl,
                nombreDoc
            )
        );

        return {
            mensaje: 'Cita creada exitosamente',
            cita
        };
    }

    // SOLICITAR CITA (PACIENTE)
    async solicitarCita(dto: SolicitarCitaDto, id_usuario: number, id_consultorio: number) {
        // Buscar paciente según su usuario y consultorio
        const paciente = await this.prisma.paciente.findFirst({
            where: { 
                id_usuario: id_usuario, 
                id_consultorio: id_consultorio 
            }
        });

        if (!paciente) {
            throw new NotFoundException('Paciente no encontrado');
        }

         // Validar disponibilidad
        await this.validarDisponibilidad(dto.fecha, dto.hora_inicio, id_consultorio);

        // Crear cita con status "pendiente" (solicitud)
        const cita = await this.prisma.cita.create({
            data: {
                id_paciente: paciente.id_paciente,
                id_motivo: dto.id_motivo,
                fecha: new Date(dto.fecha),
                hora_inicio: new Date(`${dto.fecha}T${dto.hora_inicio}`),
                frecuencia: 'unica', //defecto (paciente no sabe se supone ps)
                notas: dto.notas,
                id_consultorio,
                status: StatusCitas.PENDIENTE
            },
            include: {
                paciente: { include: { usuario: true } },
                consultorio: true
            }
        });

        const { logoUrl } = this.extraerDatosConsultorio(cita.consultorio);
        const nombrePaciente = `${cita.paciente.nombre} ${cita.paciente.apellido1 || ''}`.trim();

        this.enviarCorreoSeguro(() =>
            this.mailerService.enviarNotificacionCita(
                cita.consultorio.correo, 'solicitud_pendiente',
                {
                    fecha: dto.fecha,
                    hora: dto.hora_inicio,
                    nombrePaciente
                },
                logoUrl
            )
        );

        return {
            mensaje: 'Solicitud de cita enviada. Espera confirmación del dentista.',
            cita
        };
        
    }

    // CONFIRMAR/RECHAZAR CITA (DENTISTA)
    async actualizarStatusCita(idCita: number, dto: ActualizarStatusCitaDto, idUsuario: number, idConsultorio: number) {
        const cita = await this.prisma.cita.findUnique({
            where: { id_cita: idCita },
            include: {
                paciente: { include: { usuario: true } },
                motivo_consulta: true,
                consultorio: true
            }
        });

        if (!cita) {
            throw new NotFoundException('Cita no encontrada');
        }

        if (cita.id_consultorio !== idConsultorio) {
            throw new ForbiddenException('No tienes permiso para modificar esta cita');
        }

        this.validarTransicionEstado(cita.status, dto.status);

        // Actualizar status
        const citaActualizada = await this.prisma.cita.update({
            where: { id_cita: idCita },
            data: { status: dto.status },
            include: {
                paciente: { include: { usuario: true } },
                motivo_consulta: true,
                consultorio: true
            }
        });

        // Notificar al paciente
        const tipoNotificacion = dto.status === StatusCitas.PROGRAMADA ? 'programada' : dto.status === StatusCitas.CANCELADA ? 'cancelada' : null;

        if (tipoNotificacion) {
            const { logoUrl, nombreDoc } = this.extraerDatosConsultorio(cita.consultorio);

            this.enviarCorreoSeguro(() =>
                this.mailerService.enviarNotificacionCita(
                    cita.paciente.usuario.correo,
                    tipoNotificacion,
                    {
                        fecha: this.formatearFechaDB(cita.fecha),
                        hora: this.formatearHoraDB(cita.hora_inicio),
                    },
                    logoUrl,
                    nombreDoc
                )
            );
        } 

        return {
            mensaje: `Cita ${dto.status} exitosamente`,
            cita: citaActualizada
        };
    }

    // CANCELAR CITA (AMBOS ROLES)
    // ============================================
    async cancelarCita(idCita: number, idUsuario: number, rol: 'dentista' | 'paciente') {
        const cita = await this.prisma.cita.findUnique({
            where: { id_cita: idCita },
            include: {
                paciente: { include: { usuario: true } },
                motivo_consulta: true,
                consultorio: true
            }
        });

        if (!cita) {
            throw new NotFoundException('Cita no encontrada');
        }

        // Validación de tiempo: no cancelar menos de 2 horas antes
        const ahora = new Date();
        const fechaHoraCita = new Date(`${this.formatearFechaDB(cita.fecha)}T${this.formatearHoraDB(cita.hora_inicio)}`);
        const diferenciaHoras = (fechaHoraCita.getTime() - ahora.getTime()) / (1000 * 60 * 60);

        if (diferenciaHoras < 2 && diferenciaHoras > 0) {
            throw new BadRequestException('No se puede cancelar una cita con menos de 2 horas de anticipación');
        }

        // Validar permisos según rol, Si es paciente solo puede cancelar su propia cita
        if (rol === 'paciente' && cita.paciente.usuario.id_usuario !== idUsuario) {
            throw new ForbiddenException('No puedes cancelar esta cita');
        }

        // Cancelar cita
        const citaCancelada = await this.prisma.cita.update({
            where: { id_cita: idCita },
            data: { status: StatusCitas.CANCELADA }
        });

        const { logoUrl, nombreDoc } = this.extraerDatosConsultorio(cita.consultorio);
        const destinatario = rol === 'paciente' ? cita.consultorio.correo : cita.paciente.usuario.correo;

        this.enviarCorreoSeguro(() =>
            this.mailerService.enviarNotificacionCita(
                destinatario, 
                'cancelada',
                {
                    fecha: this.formatearFechaDB(cita.fecha),
                    hora: this.formatearHoraDB(cita.hora_inicio),
                },
                logoUrl,
                nombreDoc
            )
        );

        return {
            mensaje: 'Cita cancelada exitosamente',
            cita: citaCancelada
        };
    }

    // SOLICITAR REPROGRAMACIÓN 
    async solicitarReprogramacion(dto: ReprogramarCitaDto, idUsuario: number, rol: 'dentista' | 'paciente', id_consultorio: number) {
        const cita = await this.prisma.cita.findUnique({
            where: { id_cita: dto.id_cita },
            include: {
                paciente: { include: { usuario: true } },
                consultorio: true
            }
        });

        if (!cita) {
            throw new NotFoundException('Cita no encontrada');
        }

         // Validar que pertenezca al consultorio
        if (cita.id_consultorio !== id_consultorio) {
            throw new ForbiddenException('No tienes permiso en este consultorio');
        }

        const totalReprogramaciones = await this.prisma.reprogramacion_cita.count({
            where: {
                id_cita: dto.id_cita,
                status: { in: [StatusCitaReprog.ACEPTADA, StatusCitaReprog.PENDIENTE] }
            }
        });

        if (totalReprogramaciones >= 3) {
            throw new ForbiddenException('Esta cita ya alcanzó el límite de 3 reprogramaciones.');
        }

        // Validación de tiempo: no dejar reprogramar menos de 1 hora antes
        const ahora = new Date();
        const fechaHoraCita = new Date(`${this.formatearFechaDB(cita.fecha)}T${this.formatearHoraDB(cita.hora_inicio)}`);
        const diferenciaHoras = (fechaHoraCita.getTime() - ahora.getTime()) / (1000 * 60 * 60);

        if (diferenciaHoras < 1 && diferenciaHoras > 0) {
            throw new BadRequestException('No se puede reprogramar una cita con menos de 1 hora de anticipación');
        }

        await this.validarDisponibilidad(dto.nueva_fecha, dto.nueva_hora, id_consultorio, dto.id_cita);

        // Crear solicitud de reprogramación
        //TRANSACCIÓN ATÓMICA
        const reprogramacion = await this.prisma.$transaction(async (tx) => {
            const nuevaReprog = await tx.reprogramacion_cita.create({
                data: {
                    id_cita: dto.id_cita,
                    solicitada_por: rol,
                    fecha_original: cita.fecha,
                    hora_original: cita.hora_inicio,
                    nueva_fecha: new Date(dto.nueva_fecha),
                    nueva_hora: new Date(`${dto.nueva_fecha}T${dto.nueva_hora}`),
                    id_consultorio,
                    status: StatusCitaReprog.PENDIENTE
                }
            });

            await tx.cita.update({
                where: { id_cita: dto.id_cita },
                data: { status: StatusCitas.REPROGRAMADA }
            });

            return nuevaReprog;
        });

        const { logoUrl, nombreDoc } = this.extraerDatosConsultorio(cita.consultorio);
        //Notificar a la otra parte
        const destinatario = rol === 'paciente' ? cita.consultorio.correo : cita.paciente.usuario.correo;

        this.enviarCorreoSeguro(() =>
            this.mailerService.enviarNotificacionReprogramacion(
                destinatario, 'solicitud',
                {
                    fechaOriginal: this.formatearFechaDB(cita.fecha),
                    horaOriginal: this.formatearHoraDB(cita.hora_inicio),
                    nuevaFecha: dto.nueva_fecha,
                    nuevaHora: dto.nueva_hora,
                    solicitadoPor: rol
                },
                logoUrl,
                nombreDoc
            )
        );

        return {
            mensaje: 'Solicitud de reprogramación enviada. Espera confirmación.',
            reprogramacion
        };
    }

    // RESPONDER REPROGRAMACIÓN (ROL CONTRARIO)
    async responderReprogramacion(idReprogramacion: number, dto: ResponderReprogramacionDto, idUsuario: number, rol: 'dentista' | 'paciente') {
        const reprogramacion = await this.prisma.reprogramacion_cita.findUnique({
            where: { id_reprogramacion: idReprogramacion },
            include: {
                cita: {
                    include: {
                        paciente: { include: { usuario: true } },
                        consultorio: true
                    }
                }
            }
        });

        if (!reprogramacion) {
            throw new NotFoundException('Solicitud de reprogramación no encontrada');
        }

        // Validar que el usuario sea el destinatario correcto
        const solicitante = reprogramacion.solicitada_por;
        if (solicitante === 'paciente' && rol !== 'dentista') {
            throw new ForbiddenException('Solo el dentista puede responder esta solicitud');
        }

        if (solicitante === 'dentista' && rol !== 'paciente') {
            throw new ForbiddenException('Solo el paciente puede responder esta solicitud');
        }

        const cita = reprogramacion.cita;
        return await this.prisma.$transaction(async (tx) => {
            if (dto.aceptar) {
                await tx.cita.update({
                    where: { id_cita: reprogramacion.id_cita },
                    data: {
                        fecha: reprogramacion.nueva_fecha,
                        hora_inicio: reprogramacion.nueva_hora,
                        status: StatusCitas.PROGRAMADA
                    }
                });

                await tx.reprogramacion_cita.update({
                    where: { id_reprogramacion: idReprogramacion },
                    data: { status: StatusCitaReprog.ACEPTADA }
                });

                const { logoUrl, nombreDoc } = this.extraerDatosConsultorio(cita.consultorio);
                const destinatario = solicitante === 'paciente' ? cita.paciente.usuario.correo : cita.consultorio.correo;

                this.enviarCorreoSeguro(() =>
                    this.mailerService.enviarNotificacionReprogramacion(
                        destinatario, 
                        'aceptada',
                        {
                            fechaOriginal: this.formatearFechaDB(reprogramacion.fecha_original),
                            horaOriginal: this.formatearHoraDB(reprogramacion.hora_original),
                            nuevaFecha: this.formatearFechaDB(reprogramacion.nueva_fecha),
                            nuevaHora: this.formatearHoraDB(reprogramacion.nueva_hora),
                        },
                        logoUrl,
                        nombreDoc
                    )
                );

                return { mensaje: 'Reprogramación aceptada exitosamente' };
            } else {
                // Rechazar reprogramación: volver status a programada
                await tx.cita.update({
                    where: { id_cita: reprogramacion.id_cita },
                    data: { status: StatusCitas.PROGRAMADA }
                });

                await tx.reprogramacion_cita.update({
                    where: { id_reprogramacion: idReprogramacion },
                    data: { status: StatusCitaReprog.CANCELADA }
                });

                const { logoUrl, nombreDoc } = this.extraerDatosConsultorio(cita.consultorio);
                const destinatario = solicitante === 'paciente' ? cita.paciente.usuario.correo : cita.consultorio.correo;

                this.enviarCorreoSeguro(() =>
                    this.mailerService.enviarNotificacionReprogramacion(
                        destinatario, 
                        'rechazada',
                        {
                            fechaOriginal: this.formatearFechaDB(reprogramacion.fecha_original),
                            horaOriginal: this.formatearHoraDB(reprogramacion.hora_original),
                            nuevaFecha: this.formatearFechaDB(reprogramacion.nueva_fecha),
                            nuevaHora: this.formatearHoraDB(reprogramacion.nueva_hora),
                        },
                        logoUrl,
                        nombreDoc
                    )
                );

                return { mensaje: 'Reprogramación rechazada' };
            }
        });
    }

    // CONSULTAS Y LISTADOS
    // CONSULTAR DISPONIBILIDAD (PACIENTE)
    async consultarDisponibilidad(dto: ConsultarDisponibilidadDto, id_consultorio: number) {
        const fecha = new Date(dto.fecha);
        // Obtener día de la semana 1–7 (1 Lunes, 7 Domingo)
        const dia = fecha.getDay(); // 0 = Domingo, 6 = Sábado
        const diaSemana = dia === 0 ? 7 : dia; // Convierte Domingo (0) a 7

        // Obtener horario del consultorio
        const consultorio = await this.prisma.consultorio.findUnique({
            where: { id_consultorio },
            include: { horario: true }
        });

        if (!consultorio) {
            throw new NotFoundException('Consultorio no encontrado');
        }

        // Filtrar horarios del día consultado
        const horariosDelDia = consultorio.horario.filter(h => h.dia === diaSemana);

        if (horariosDelDia.length === 0) {
            return { horasDisponibles: [], mensaje: 'El consultorio no atiende este día' };
        }

        // Generar horas disponibles (cada 30 min por defecto)
        const horasDisponibles: string[] = [];
        for (const horario of horariosDelDia) {
            let horaActual = this.parseHora(horario.hora_inicio);
            const horaFin = this.parseHora(horario.hora_fin);

            while (horaActual < horaFin) {
                horasDisponibles.push(this.formatHora(horaActual));
                horaActual.setMinutes(horaActual.getMinutes() + 30);
            }
        }

        const [citasDelDia, eventosDelDia] = await Promise.all([
            this.prisma.cita.findMany({
                where: {
                    fecha: new Date(dto.fecha),
                    id_consultorio,
                    status: { in: [StatusCitas.PROGRAMADA, StatusCitas.PENDIENTE] }
                }
            }),
            this.prisma.evento.findMany({
                where: {
                    id_consultorio,
                    fecha_inicio: { lte: new Date(dto.fecha) },
                    fecha_fin: { gte: new Date(dto.fecha) },
                    status: StatusEvento.ACTIVO
                }
            })
        ]);

        const horasOcupadas = citasDelDia.map(c => this.formatearHoraDB(c.hora_inicio));

        const horasOcupadasPorEventos: string[] = [];
        for (const evento of eventosDelDia) {
            if (evento.evento_todo_el_dia === 'si') {
                horasOcupadasPorEventos.push(...horasDisponibles);
            } else if (evento.hora_inicio && evento.hora_fin) {
                let horaEv = this.parseHora(evento.hora_inicio);
                const horaFinEv = this.parseHora(evento.hora_fin);

                while (horaEv < horaFinEv) {
                    horasOcupadasPorEventos.push(this.formatHora(horaEv));
                    horaEv.setMinutes(horaEv.getMinutes() + 30);
                }
            }
        }

        const horasLibres = horasDisponibles.filter(
            h => !horasOcupadas.includes(h) && !horasOcupadasPorEventos.includes(h)
        );

        return { horasDisponibles: horasLibres };
    }

    // LISTAR CITAS (CON FILTROS) AQUI ME QUEDE
    // ============================================
    async listarCitas(filtros: {
        idUsuario: number;
        rol: 'paciente' | 'dentista';
        fecha?: string;
        status?: StatusCitas;
    }) {
        const where: any = {};

        if (filtros.rol === 'paciente') {
            const id_paciente = await this.obtenerIdPaciente(filtros.idUsuario);
            where.id_paciente = id_paciente;
        }

        if (filtros.rol === 'dentista') {
            const id_consultorio = await this.obtenerConsultorioDentista(filtros.idUsuario);
            where.id_consultorio = id_consultorio;
        }

        if (filtros.fecha) {
            where.fecha = new Date(filtros.fecha);
        }

        if (filtros.status) {
            where.status = filtros.status;
        }

        const citas = await this.prisma.cita.findMany({
            where,
            include: {
                paciente: { include: { usuario: true } },
                motivo_consulta: true,
                consultorio: { 
                    include:  {
                        usuario: {
                            where: { rol: 'dentista' },
                            select: { id_usuario: true, correo: true }
                        }
                    }
                }
            },
            orderBy: { fecha: 'asc' }
        });

        return citas;
    }

    // OBTENER CITA POR ID
    async obtenerCitaPorId(idCita: number, idUsuario: number, rol: 'dentista' | 'paciente') {
        const cita = await this.prisma.cita.findUnique({
            where: { id_cita: idCita },
            include: {
                paciente: { include: { usuario: true } },
                motivo_consulta: true,
                consultorio: true,
                reprogramacion_cita: {
                    orderBy: { fecha_solicitud: 'desc' },
                    take: 1
                }
            }
        });

        if (!cita) {
            throw new NotFoundException('Cita no encontrada');
        }

        // Validar permisos
        if (rol === 'paciente' && cita.paciente.usuario.id_usuario !== idUsuario) {
            throw new ForbiddenException('No tienes permiso para ver esta cita');
        }

        if (rol === 'dentista') {
            await this.validarPermisoDentista(idUsuario, cita.id_consultorio);
        }

        return cita;
    }

    // OBTENER CITAS DEL DÍA (DENTISTA)
    async obtenerCitasDelDia(idUsuario: number, fecha?: string) {
        const fechaBusqueda = fecha ? new Date(fecha) : new Date();
        fechaBusqueda.setHours(0, 0, 0, 0);

        const fechaFin = new Date(fechaBusqueda);
        fechaFin.setHours(23, 59, 59, 999);

        const id_consultorio = await this.obtenerConsultorioDentista(idUsuario);

        return await this.prisma.cita.findMany({
            where: {
                id_consultorio,
                fecha: { gte: fechaBusqueda, lte: fechaFin },
                status: { in: [StatusCitas.PROGRAMADA, StatusCitas.PENDIENTE] }
            },
            include: {
                paciente: { include: { usuario: true } },
                motivo_consulta: true,
                consultorio: true
            },
            orderBy: { hora_inicio: 'asc' }
        });
    }

    // OBTENER PRÓXIMAS CITAS (PACIENTE)
    async obtenerProximasCitas(idUsuario: number, limite: number = 5) {
        const ahora = new Date();
        const id_paciente = await this.obtenerIdPaciente(idUsuario);

        return await this.prisma.cita.findMany({
            where: {
                id_paciente,
                status: { in: [StatusCitas.PROGRAMADA, StatusCitas.PENDIENTE] },
                OR: [
                    { fecha: { gt: ahora } },
                    {
                        AND: [
                            { fecha: ahora },
                            { hora_inicio: { gte: ahora } }
                        ]
                    }
                ]
            },
            include: {
                motivo_consulta: true,
                consultorio: {
                    include: {
                        usuario: {
                            where: { rol: 'dentista' },
                            select: { id_usuario: true, correo: true }
                        }
                    }
                }
            },
            orderBy: [
                { fecha: 'asc' },
                { hora_inicio: 'asc' }
            ],
            take: limite
        });
    }

    // ============================================
    // OBTENER HISTORIAL DE CITAS (PACIENTE)
    // ============================================
    async obtenerHistorialCitas(idUsuario: number, pagina: number = 1, limite: number = 10) {
        const skip = (pagina - 1) * limite;
        const id_paciente = await this.obtenerIdPaciente(idUsuario);

        const [citas, total] = await Promise.all([
            this.prisma.cita.findMany({
                where: {
                    id_paciente,
                    status: { in: [StatusCitas.COMPLETADA, StatusCitas.CANCELADA] }
                },
                include: {
                    motivo_consulta: true,
                    consultorio: {
                        include: {
                            usuario: {
                                where: { rol: 'dentista' },
                                select: { id_usuario: true, correo: true }
                            }
                        }
                    }
                },
                orderBy: { fecha: 'desc' },
                skip,
                take: limite
            }),
            this.prisma.cita.count({
                where: {
                    id_paciente,
                    status: { in: [StatusCitas.COMPLETADA, StatusCitas.CANCELADA] }
                }
            })
        ]);

        return {
            citas,
            paginacion: {
                total,
                pagina,
                limite,
                totalPaginas: Math.ceil(total / limite)
            }
        };
    }


    // MARCAR CITA COMO COMPLETADA (DENTISTA)
    async marcarCitaCompletada(idCita: number, idUsuario: number) {
        const cita = await this.prisma.cita.findUnique({
            where: { id_cita: idCita }
        });

        if (!cita) {
            throw new NotFoundException('Cita no encontrada');
        }

        await this.validarPermisoDentista(idUsuario, cita.id_consultorio);

        this.validarTransicionEstado(cita.status, StatusCitas.COMPLETADA);

        const citaActualizada = await this.prisma.cita.update({
            where: { id_cita: idCita },
            data: { status: StatusCitas.COMPLETADA }
        });

        return {
            mensaje: 'Cita marcada como completada',
            cita: citaActualizada
        };
    }

    // OBTENER CITAS PENDIENTES (DENTISTA)
    async obtenerCitasPendientes(id_consultorio: number) {
        return await this.prisma.cita.findMany({
            where: {
                id_consultorio,
                status: StatusCitas.PENDIENTE
            },
            include: {
                paciente: { include: { usuario: true } },
                motivo_consulta: true,
                consultorio: true
            },
            orderBy: [
                { fecha: 'asc' },
                { hora_inicio: 'asc' }
            ]
        });
    }


    // OBTENER REPROGRAMACIONES PENDIENTES
    async obtenerReprogramacionesPendientes(idUsuario?: number, rol?: 'dentista' | 'paciente', id_consultorio?: number) {
        let where: any = {
            status: StatusCitaReprog.PENDIENTE // pendiente de aprobación
        };

        if (rol === 'dentista') {
            let idConsultorioFinal: number | null = null;

            if (id_consultorio) {
                idConsultorioFinal = id_consultorio;
            } else if (idUsuario) {
                idConsultorioFinal = await this.obtenerConsultorioDentista(idUsuario);
            }

            where.id_consultorio = idConsultorioFinal;
            where.solicitada_por = ReprogSolicitadaPor.PACIENTE;
        } else if (rol === 'paciente' && idUsuario) {
            // Obtener reprogramaciones donde el dentista solicitó
            where.cita = {
                paciente: {
                    usuario: { id_usuario: idUsuario }
                }
            };
            where.solicitada_por = ReprogSolicitadaPor.DENTISTA;
        }

        return await this.prisma.reprogramacion_cita.findMany({
            where,
            include: {
                cita: {
                    include: {
                        paciente: { include: { usuario: true } },
                        motivo_consulta: true,
                        consultorio: { include: { usuario: true } }
                    }
                }
            },
            orderBy: { fecha_solicitud: 'desc' }
        });
    }

    // OBTENER ESTADÍSTICAS DE CITAS (DENTISTA)
    async obtenerEstadisticas(idUsuario: number, fechaInicio?: string, fechaFin?: string) {
        const id_consultorio = await this.obtenerConsultorioDentista(idUsuario);

        const where: any = { id_consultorio };

        // Rango opcional de fechas
        if (fechaInicio && fechaFin) {
            where.fecha = {
                gte: new Date(fechaInicio),
                lte: new Date(fechaFin)
            };
        }

        //Queries paralelas por-para velocidad
        const [total, programadas, pendientes, completadas, canceladas] = await Promise.all([
            this.prisma.cita.count({ where }),
            this.prisma.cita.count({ where: { ...where, status: StatusCitas.PROGRAMADA } }),
            this.prisma.cita.count({ where: { ...where, status: StatusCitas.PENDIENTE } }),
            this.prisma.cita.count({ where: { ...where, status: StatusCitas.COMPLETADA } }),
            this.prisma.cita.count({ where: { ...where, status: StatusCitas.CANCELADA } })
        ]);

        return {
            total,
            programadas,
            pendientes,
            completadas,
            canceladas,
            tasaCompletadas: total > 0 ? ((completadas / total) * 100).toFixed(2) : 0,
            tasaCanceladas: total > 0 ? ((canceladas / total) * 100).toFixed(2) : 0
        };
    }


    // VERIFICAR SI HAY CONFLICTOS DE HORARIO
    async verificarConflictos(
        fecha: string,
        horaInicio: string,
        idConsultorio: number,
        idCitaExcluir?: number
    ): Promise<{ disponible: boolean; mensaje?: string }> {
        try {
            await this.validarDisponibilidad(fecha, horaInicio, idConsultorio, idCitaExcluir);
            return { disponible: true };
        } catch (error) {
            return {
                disponible: false,
                mensaje: error.message
            };
        }
    }

    // OBTENER HORARIOS OCUPADOS DE UN DÍA
    async obtenerHorariosOcupados(fecha: string, idConsultorio: number) {
        const [citas, eventos] = await Promise.all([
            this.prisma.cita.findMany({
                where: {
                    fecha: new Date(fecha),
                    id_consultorio: idConsultorio,
                    status: { in: [StatusCitas.PROGRAMADA, StatusCitas.PENDIENTE] }
                },
                select: {
                    hora_inicio: true,
                    motivo_consulta: { 
                        select: {
                            id_motivo: true,
                            nombre: true,
                            servicio: {
                                select: { nombre: true }
                            }
                        }
                    }
                }
            }),
            this.prisma.evento.findMany({
                where: {
                    id_consultorio: idConsultorio,
                    fecha_inicio: { lte: new Date(fecha) },
                    fecha_fin: { gte: new Date(fecha) },
                    status: 'activo'
                },
                select: {
                    evento_todo_el_dia: true,
                    hora_inicio: true,
                    hora_fin: true,
                    titulo: true
                }
            })
        ]);

        const horariosOcupados = citas.map(c => ({
            hora: this.formatearHoraDB(c.hora_inicio),
            tipo: 'cita',
            descripcion: c.motivo_consulta?.nombre ?? 'Sin motivo'
        }));

        eventos.forEach(evento => {
            if (evento.evento_todo_el_dia === 'si') {
                horariosOcupados.push({
                    hora: 'Todo el día',
                    tipo: 'evento',
                    descripcion: evento.titulo
                });
            } else if (evento.hora_inicio && evento.hora_fin) {
                horariosOcupados.push({
                    hora: `${evento.hora_inicio} - ${evento.hora_fin}`,
                    tipo: 'evento',
                    descripcion: evento.titulo
                });
            }
        });

        return horariosOcupados;
    }

    // CRON JOB - RECORDATORIOS
    @Cron(CronExpression.EVERY_DAY_AT_9AM)
    async enviarRecordatorios() {
        this.logger.log('Ejecutando envío de recordatorios de citas...');

        const manana = new Date();
        manana.setDate(manana.getDate() + 1);
        manana.setHours(0, 0, 0, 0);

        const finManana = new Date(manana);
        finManana.setHours(23, 59, 59, 999);

        const citasManana = await this.prisma.cita.findMany({
            where: {
                fecha: { gte: manana, lte: finManana },
                status: StatusCitas.PROGRAMADA
            },
            include: {
                paciente: { include: { usuario: true } },
                motivo_consulta: true,
                consultorio: true
            }
        });

        for (const cita of citasManana) {
            try {
                const { logoUrl, nombreDoc } = this.extraerDatosConsultorio(cita.consultorio);

                await this.mailerService.enviarRecordatorioCita(
                    cita.paciente.usuario.correo,
                    {
                        fecha: this.formatearFechaDB(cita.fecha),
                        hora: this.formatearHoraDB(cita.hora_inicio),
                        nombreDentista: nombreDoc
                    },
                    logoUrl,
                    nombreDoc
                );
                this.logger.log(`Recordatorio enviado a ${cita.paciente.usuario.correo}`);
            } catch (error) {
                this.logger.error(`Error enviando recordatorio: ${error.message}`);
            }
        }

        this.logger.log(`Recordatorios enviados: ${citasManana.length}`);
    }

    //-----------------------METODOS AUXILIARES PARA VALIDAR Y SIMPLIFICAR FLUJO REPETIDO------------------------
    private async validarDisponibilidad(
        fecha: string, 
        hora: string, 
        idConsultorio: number,
        idCitaExcluir?: number
    ) {
        const fechaHora = new Date(`${fecha}T${hora}`);

        const citaExistente = await this.prisma.cita.findFirst({
            where: {
                fecha: new Date(fecha),
                hora_inicio: fechaHora,
                id_consultorio: idConsultorio,
                status: { in: [StatusCitas.PROGRAMADA, StatusCitas.PENDIENTE] },
                ...(idCitaExcluir && { id_cita: { not: idCitaExcluir } })
            }
        });

        if (citaExistente) {
            throw new BadRequestException('Ya existe una cita programada en ese horario');
        }

        const eventoConflicto = await this.prisma.evento.findFirst({
            where: {
                id_consultorio: idConsultorio,
                fecha_inicio: { lte: new Date(fecha) },
                fecha_fin: { gte: new Date(fecha) },
                status: 'activo',
                OR: [
                    { evento_todo_el_dia: 'si' },
                    {
                        AND: [
                            { hora_inicio: { lte: hora } },
                            { hora_fin: { gt: hora } }
                        ]
                    }
                ]
            }
        });

        if (eventoConflicto) {
            throw new BadRequestException('Existe un evento programado que bloquea ese horario');
        }
    }

    private validarTransicionEstado(estadoActual: string, nuevoEstado: StatusCitas) {
        const transicionesPermitidas = this.TRANSICIONES_VALIDAS[estadoActual];
        
        if (!transicionesPermitidas || !transicionesPermitidas.includes(nuevoEstado)) {
            throw new BadRequestException(
                `No se puede cambiar el estado de "${estadoActual}" a "${nuevoEstado}"`
            );
        }
    }

    // MÉTODOS HELPER - PERMISOS Y BÚSQUEDAS
    private async validarPermisoDentista(idUsuario: number, idConsultorio: number): Promise<void> {
        const usuario = await this.prisma.usuario.findFirst({
            where: {
                id_usuario: idUsuario,
                rol: Rol.DENTISTA,
                id_consultorio: idConsultorio
            }
        });

        if (!usuario) {
            throw new ForbiddenException('No tienes permiso para realizar esta acción en este consultorio');
        }
    }

    private async obtenerIdPaciente(idUsuario: number): Promise<number> {
        const paciente = await this.prisma.paciente.findFirst({
            where: { 
                usuario: { id_usuario: idUsuario }
            },
            select: { id_paciente: true }
        });

        if (!paciente) {
            throw new NotFoundException('Paciente no encontrado');
        }

        return paciente.id_paciente;
    }

    private async obtenerConsultorioDentista(idUsuario: number): Promise<number> {
        const usuario = await this.prisma.usuario.findFirst({
            where: {
                id_usuario: idUsuario,
                rol: Rol.DENTISTA
            },
            select: { id_consultorio: true }
        });

        if (!usuario?.id_consultorio) {
            throw new NotFoundException('Dentista no tiene consultorio asignado');
        }

        return usuario.id_consultorio;
    }

    // MÉTODOS HELPER - FORMATO DE FECHAS/HORAS
    private formatearHoraDB(fecha: Date): string {
        return fecha.toISOString().substring(11, 16);
    }

    private formatearFechaDB(fecha: Date): string {
        return fecha.toISOString().split('T')[0];
    }

    private parseHora(hora: string): Date {
        const [h, m] = hora.split(':').map(Number);
        const date = new Date();
        date.setHours(h, m, 0, 0);
        return date;
    }

    private formatHora(date: Date): string {
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }

    // MÉTODOS HELPER - DATOS DE CONSULTORIO
    private extraerDatosConsultorio(consultorio: any): { logoUrl: string; nombreDoc: string } {
        const logoUrl = consultorio?.logo_url || '';
        const nombreTitular = consultorio?.titular_nombre || '';
        const apellidoTitular = consultorio?.titular_ap1 || '';
        const nombreDoc = `${nombreTitular} ${apellidoTitular}`.trim() || 'Odontix';

        return { logoUrl, nombreDoc };
    }

    // MÉTODO HELPER - ENVÍO SEGURO DE CORREOS
    private async enviarCorreoSeguro(callback: () => Promise<void>): Promise<void> {
        try {
            await callback();
        } catch (error) {
            this.logger.error(`Error al enviar correo: ${error.message}`);
            // No lanzar error para no bloquear operación principal
        }
    }
}
