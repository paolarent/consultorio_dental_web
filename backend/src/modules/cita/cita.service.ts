import { BadRequestException, ConflictException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { MailerService } from 'src/common/mail/mail.service';
import { CrearCitaDto } from './dto/create-cita.dto';
import { SolicitarCitaDto } from './dto/solicitar-cita.dto';
import { ReprogSolicitadaPor, Rol, Status, StatusCitaReprog, StatusCitas, StatusEvento } from 'src/common/enums';
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

    async listarMotivos(id_consultorio: number) {
        return this.prisma.motivo_consulta.findMany({
        where: {
            status: Status.ACTIVO,
            id_consultorio
        },
        select: {
                id_motivo: true,
                nombre: true,
                id_servicio: true,
            }
        });
    }

    // DEFINICIÓN DE TRANSICIONES VÁLIDAS
    private readonly TRANSICIONES_VALIDAS: Record<string, StatusCitas[]> = {
        [StatusCitas.PENDIENTE]: [StatusCitas.PROGRAMADA, StatusCitas.CANCELADA],
        [StatusCitas.PROGRAMADA]: [StatusCitas.COMPLETADA, StatusCitas.CANCELADA, StatusCitas.REPROGRAMADA],
        [StatusCitas.REPROGRAMADA]: [StatusCitas.PROGRAMADA, StatusCitas.CANCELADA],
        [StatusCitas.COMPLETADA]: [],
        [StatusCitas.CANCELADA]: []
    };

    //Convierte hora 12h (8:00 AM) a 24h (08:00:00)
    private convertir12hA24h(hora12h: string): string {
        const match = hora12h.trim().match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (!match) {
            // Si ya viene en formato 24h, normalizarlo
            if (hora12h.match(/^\d{1,2}:\d{2}(:\d{2})?$/)) {
            const [h, m] = hora12h.split(':');
            return `${h.padStart(2, '0')}:${m.padStart(2, '0')}:00`;
            }
            throw new BadRequestException('Formato de hora inválido. Use HH:MM AM/PM');
        }
        
        let [_, horas, minutos, periodo] = match;
        let hora24 = parseInt(horas);
        
        if (periodo.toUpperCase() === 'PM' && hora24 !== 12) {
            hora24 += 12;
        } else if (periodo.toUpperCase() === 'AM' && hora24 === 12) {
            hora24 = 0;
        }
        
        return `${String(hora24).padStart(2, '0')}:${minutos.padStart(2, '0')}:00`;
    }

    //Convierte hora 24h (08:00:00) a 12h (8:00 AM)
    private convertir24hA12h(hora24h: string): string {
        // Acepta HH:MM o HH:MM:SS
        const partes = hora24h.split(':');
        const horaStr = partes[0];
        const minStr = partes[1];

        let hora = parseInt(horaStr);
        const minutos = minStr || '00';
        
        const periodo = hora >= 12 ? 'PM' : 'AM';
        hora = hora % 12 || 12;

        return `${hora}:${minutos} ${periodo}`;
    }


    //Calcula la hora de fin sumando la duración del servicio
    private calcularHoraFin(horaInicio: string, duracionMinutos: number): string {
        // Asegurar que horaInicio esté en formato 24h
        const hora24 = horaInicio.includes('AM') || horaInicio.includes('PM') 
            ? this.convertir12hA24h(horaInicio) 
            : horaInicio;
        
        const [horas, minutos] = hora24.split(':').map(Number);
        const fecha = new Date();
        fecha.setHours(horas, minutos, 0, 0);
        fecha.setMinutes(fecha.getMinutes() + duracionMinutos);
        
        return `${String(fecha.getHours()).padStart(2, '0')}:${String(fecha.getMinutes()).padStart(2, '0')}:00`;
    }

    //Obtiene el servicio y calcula hora_fin
    private async obtenerServicioYCalcularFin(id_servicio: number, hora_inicio: string) {
    const servicio = await this.prisma.servicio.findUnique({
        where: { id_servicio },
        select: { duracion_base: true }
    });

    if (!servicio) {
        throw new NotFoundException('Servicio no encontrado');
    }

    const duracion = Number(servicio.duracion_base);
    const hora_fin = this.calcularHoraFin(hora_inicio, duracion);
    
    return { duracion_base: duracion, hora_fin };
    }

    //Convierte una hora string a DateTime para la fecha dada
    private convertirHoraADateTime(fecha: string, hora: string): Date {
        // Convertir a formato 24h si viene en 12h
        const hora24 = hora.includes('AM') || hora.includes('PM') 
            ? this.convertir12hA24h(hora) 
            : hora;
        
        // Asegurar formato HH:MM:SS
        const horaCompleta = hora24.length === 5 ? `${hora24}:00` : hora24;
        
        return new Date(`${fecha}T${horaCompleta}`);
    }

    //Verifica si dos rangos de horarios se traslapan retorna true si hay traslape, false si no
    private verificarTraslapeHorarios(
        inicio1: string,
        fin1: string,
        inicio2: string,
        fin2: string
    ): boolean {
        // Dos rangos se traslapan si:
        // - El inicio de uno está antes del fin del otro, Y
        // - El fin de uno está después del inicio del otro
        
        // Casos de traslape:
        // 1. [----cita----]
        //      [--evento--]
        
        // 2.    [--cita--]
        //    [----evento----]
        
        // 3. [----cita----]
        //         [--evento--]
        
        // 4.      [--cita--]
        //    [--evento--]
        
        return inicio1 < fin2 && fin1 > inicio2;
    }

    private horaEnRango(hora: string, inicio: string, fin: string): boolean {
        // Convertir todas a formato 24h para comparar
        const hora24 = hora.includes('AM') || hora.includes('PM') 
            ? this.convertir12hA24h(hora) 
            : hora;
        const inicio24 = inicio.includes('AM') || inicio.includes('PM') 
            ? this.convertir12hA24h(inicio) 
            : inicio;
        const fin24 = fin.includes('AM') || fin.includes('PM') 
            ? this.convertir12hA24h(fin) 
            : fin;
        
        return hora24 >= inicio24 && hora24 < fin24;
    }

    private validarFechaHoraFutura(fecha: string, hora_inicio: string, minutosAnticipacionMinima: number = 60) 
    {
        // Convertir AM/PM → 24 horas
        const hora24 = hora_inicio.includes('AM') || hora_inicio.includes('PM')
            ? this.convertir12hA24h(hora_inicio)
            : hora_inicio;

        // Crear fecha local REAL sin que se interprete en UTC
        const [y, m, d] = fecha.split("-").map(Number);
        const [hh, mm] = hora24.split(":").map(Number);

        const fechaHoraCita = new Date(y, m - 1, d, hh, mm, 0);
    
        const now = new Date();
        const ahoraLocal = new Date(now.getTime() - now.getTimezoneOffset() * 60000);

        // Tiempo mínimo requerido
        const tiempoMinimo = new Date(ahoraLocal.getTime() + minutosAnticipacionMinima * 60000);

        // Validar fecha pasada
        if (fechaHoraCita <= ahoraLocal) {
            throw new BadRequestException('No se pueden agendar citas en el pasado');
        }

        // Validar anticipación
        if (fechaHoraCita < tiempoMinimo) {
            throw new BadRequestException(
                `La cita debe agendarse con al menos ${minutosAnticipacionMinima} minutos de anticipación`
            );
        }
    }


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

        const { hora_fin } = await this.obtenerServicioYCalcularFin(
            dto.id_servicio, 
            dto.hora_inicio
        );

        // VALIDACIONES EN ORDEN:
        //Validar que no sea en el pasado (mínimo 60 min de anticipación)
        this.validarFechaHoraFutura(dto.fecha, dto.hora_inicio, 60);

        //Validar que esté dentro del horario del consultorio
        await this.validarHorarioConsultorio(dto.fecha, dto.hora_inicio, hora_fin, id_consultorio);
        
        //Validar que no haya eventos bloqueando
        await this.validarEventos(dto.fecha, dto.hora_inicio, hora_fin, id_consultorio);
        
        //Validar que no haya conflictos con otras citas
        await this.validarDisponibilidad(dto.fecha, dto.hora_inicio, hora_fin, id_consultorio);

        // Fecha sin hora
        const fechaLocal = new Date(`${dto.fecha}T00:00:00`);
        fechaLocal.setMinutes(fechaLocal.getMinutes() + fechaLocal.getTimezoneOffset());

        // Crear cita con status "programada" directamente
        const cita = await this.prisma.cita.create({
            data: {
                id_paciente: dto.id_paciente,
                id_servicio: dto.id_servicio,
                fecha: fechaLocal,
                hora_inicio: this.convertirHoraADateTime(dto.fecha, dto.hora_inicio),
                hora_fin: this.convertirHoraADateTime(dto.fecha, hora_fin),
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

        // Buscar el motivo para obtener el id_servicio
        const motivo = await this.prisma.motivo_consulta.findUnique({
            where: { id_motivo: dto.id_motivo },
            select: { id_servicio: true }
        });

        if (!motivo) {
            throw new NotFoundException('Motivo de consulta no encontrado');
        }

        if (!motivo.id_servicio) {
            throw new BadRequestException('El motivo de consulta no tiene un servicio asociado');
        }

        // Obtener servicio y calcular hora_fin
        const { hora_fin } = await this.obtenerServicioYCalcularFin(
            motivo.id_servicio, 
            dto.hora_inicio
        );

         // Validar disponibilidad
        this.validarFechaHoraFutura(dto.fecha, dto.hora_inicio, 60);
        await this.validarHorarioConsultorio(dto.fecha, dto.hora_inicio, hora_fin, id_consultorio);
        await this.validarEventos(dto.fecha, dto.hora_inicio, hora_fin, id_consultorio);
        await this.validarDisponibilidad(dto.fecha, dto.hora_inicio, hora_fin, id_consultorio);

        // Crear cita con status "pendiente" (solicitud)
        const cita = await this.prisma.cita.create({
            data: {
                id_paciente: paciente.id_paciente,
                id_motivo: dto.id_motivo,
                id_servicio: motivo.id_servicio, 
                fecha: new Date(dto.fecha),
                hora_inicio: this.convertirHoraADateTime(dto.fecha, dto.hora_inicio),
                hora_fin: this.convertirHoraADateTime(dto.fecha, hora_fin),
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
        const nombreDocFinal = rol === 'paciente' ? 'Odontix 🦷' : nombreDoc;

        this.enviarCorreoSeguro(() =>
            this.mailerService.enviarNotificacionCita(
                destinatario, 
                'cancelada',
                {
                    fecha: this.formatearFechaDB(cita.fecha),
                    hora: this.formatearHoraDB(cita.hora_inicio),
                },
                logoUrl,
                nombreDocFinal
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
                consultorio: true,
                servicio: true
            }
        });

        if (!cita) {
            throw new NotFoundException('Cita no encontrada');
        }

         // Validar que pertenezca al consultorio
        if (cita.id_consultorio !== id_consultorio) {
            throw new ForbiddenException('No tienes permiso en este consultorio');
        }

        if (!['programada', 'pendiente'].includes(cita.status)) {
            throw new BadRequestException(
                `No se puede reprogramar una cita con estado "${cita.status}". Solo se pueden reprogramar citas programadas o pendientes.`
            );
        }

        if (!cita.servicio) {
            throw new BadRequestException('La cita no tiene un servicio asociado');
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

        // Calcular nueva_hora_fin
        const nueva_hora_fin = this.calcularHoraFin(dto.nueva_hora, cita.servicio.duracion_base);

        this.validarFechaHoraFutura(dto.nueva_fecha, dto.nueva_hora, 60);
        // Validar horario del consultorio
        await this.validarHorarioConsultorio(dto.nueva_fecha, dto.nueva_hora, nueva_hora_fin, id_consultorio);

        //Validar eventos
        await this.validarEventos(dto.nueva_fecha, dto.nueva_hora, nueva_hora_fin, id_consultorio);

        //Validar disponibilidad (excluyendo la cita actual)
        await this.validarDisponibilidad(dto.nueva_fecha, dto.nueva_hora, nueva_hora_fin, id_consultorio, dto.id_cita);

        // Crear solicitud de reprogramación
        //TRANSACCIÓN ATÓMICA
        const reprogramacion = await this.prisma.$transaction(async (tx) => {
            const nuevaReprog = await tx.reprogramacion_cita.create({
                data: {
                    id_cita: dto.id_cita,
                    solicitada_por: rol,
                    fecha_original: cita.fecha,
                    hora_original: cita.hora_inicio,
                    hora_fin_original: cita.hora_fin,
                    nueva_fecha: new Date(dto.nueva_fecha),
                    nueva_hora: this.convertirHoraADateTime(dto.nueva_fecha, dto.nueva_hora),
                    nueva_hora_fin: this.convertirHoraADateTime(dto.nueva_fecha, nueva_hora_fin),
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
        const nombreDocFinal = rol === 'paciente' ? 'Odontix 🦷' : nombreDoc;

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
                nombreDocFinal
            )
        );

        return {
            mensaje: 'Solicitud de reprogramación enviada. Espera confirmación.',
            reprogramacion
        };
    }

    // RESPONDER REPROGRAMACIÓN (ROL CONTRARIO)
    async responderReprogramacion(
        idReprogramacion: number, 
        dto: ResponderReprogramacionDto, 
        idUsuario: number, 
        rol: 'dentista' | 'paciente'
    ) {
        const reprogramacion = await this.prisma.reprogramacion_cita.findUnique({
            where: { id_reprogramacion: idReprogramacion },
            include: {
                cita: {
                    include: {
                        paciente: { include: { usuario: true } },
                        consultorio: true,
                        servicio: true
                    }
                }
            }
        });

        if (!reprogramacion) {
            throw new NotFoundException('Solicitud de reprogramación no encontrada');
        }

        const solicitante = reprogramacion.solicitada_por;
        if (solicitante === 'paciente' && rol !== 'dentista') {
            throw new ForbiddenException('Solo el dentista puede responder esta solicitud');
        }

        if (solicitante === 'dentista' && rol !== 'paciente') {
            throw new ForbiddenException('Solo el paciente puede responder esta solicitud');
        }

        if (reprogramacion.status !== 'pendiente') {
            throw new BadRequestException('Esta solicitud ya fue procesada');
        }

        const cita = reprogramacion.cita;
        
        return await this.prisma.$transaction(async (tx) => {
            if (dto.aceptar) {
                
                await tx.cita.update({
                    where: { id_cita: reprogramacion.id_cita },
                    data: {
                        fecha: reprogramacion.nueva_fecha,
                        hora_inicio: reprogramacion.nueva_hora,
                        hora_fin: reprogramacion.nueva_hora_fin,
                        status: 'programada'
                    }
                });

                await tx.reprogramacion_cita.update({
                    where: { id_reprogramacion: idReprogramacion },
                    data: { status: 'aceptada' }
                });

                const { logoUrl, nombreDoc } = this.extraerDatosConsultorio(cita.consultorio);
                const destinatario = solicitante === 'paciente' 
                    ? cita.paciente.usuario.correo 
                    : cita.consultorio.correo;
                const nombreDocFinal = solicitante === 'paciente' ? nombreDoc : 'Odontix 🦷';

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
                        nombreDocFinal
                    )
                );

                return { mensaje: 'Reprogramación aceptada exitosamente' };
            } else {
                await tx.cita.update({
                    where: { id_cita: reprogramacion.id_cita },
                    data: { status: 'programada' }
                });

                await tx.reprogramacion_cita.update({
                    where: { id_reprogramacion: idReprogramacion },
                    data: { status: 'cancelada' }
                });

                const { logoUrl, nombreDoc } = this.extraerDatosConsultorio(cita.consultorio);
                const destinatario = solicitante === 'paciente' 
                    ? cita.paciente.usuario.correo 
                    : cita.consultorio.correo;
                const nombreDocFinal = solicitante === 'paciente' ? nombreDoc : 'Odontix 🦷';

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
                        nombreDocFinal
                    )
                );

                return { mensaje: 'Reprogramación rechazada' };
            }
        });
    }

    //Validar que la hora esté dentro del horario activo del consultorio
    private async validarHorarioConsultorio(
        fecha: string, 
        hora_inicio: string,
        hora_fin: string,
        id_consultorio: number
    ) {
        const fechaDate = this.convertirFechaSoloDia(fecha);
        const dia = fechaDate.getDay();
        const diaSemana = dia === 0 ? 7 : dia; // 1=Lunes, 7=Domingo

        const horariosDelDia = await this.prisma.horario.findMany({
            where: {
            id_consultorio,
            dia: diaSemana,
            status: 'activo'
            }
        });

        if (horariosDelDia.length === 0) {
            throw new BadRequestException('El consultorio no tiene horario activo para este día');
        }

        // Verificar si la cita cae dentro de algún horario activo
        const dentroDeHorario = horariosDelDia.some(horario => {
            // La hora de inicio debe estar dentro del horario
            const inicioValido = this.horaEnRango(hora_inicio, horario.hora_inicio, horario.hora_fin);
            // La hora de fin también debe estar dentro del horario (o justo al final)
            const finValido = this.horaEnRango(hora_fin, horario.hora_inicio, horario.hora_fin) ||
                            hora_fin === this.convertir12hA24h(horario.hora_fin);
            
            return inicioValido && finValido;
        });

        if (!dentroDeHorario) {
            const horarios = horariosDelDia.map(h => `${h.hora_inicio} - ${h.hora_fin}`).join(', ');
            throw new BadRequestException(
                `La cita debe estar dentro del horario del consultorio: ${horarios}`
            );
        }
    }

    // CONSULTAS Y LISTADOS
    // CONSULTAR DISPONIBILIDAD (PACIENTE)
    async consultarDisponibilidad(dto: ConsultarDisponibilidadDto, id_consultorio: number) {
        const fechaStr = dto.fecha.toString().slice(0, 10); // yyyy-mm-dd seguro
        const [y, m, d] = fechaStr.split("-").map(Number);
        const fechaConsulta = new Date(y, m - 1, d); // SIEMPRE local sin desfase

        const hoy = new Date();
        const soloHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

        if (fechaConsulta < soloHoy) {
            throw new BadRequestException("No puedes consultar disponibilidad de fechas pasadas");
        }

        const dia = fechaConsulta.getDay();
        const diaSemana = dia === 0 ? 7 : dia;

        const horariosDelDia = await this.prisma.horario.findMany({
            where: {
            id_consultorio,
            dia: diaSemana,
            status: "activo",
            },
        });

        if (horariosDelDia.length === 0) {
            return {
            horasDisponibles: [],
            mensaje: "El consultorio no atiende este día",
            };
        }

        const horasDisponibles: string[] = [];

        for (const horario of horariosDelDia) {
            const inicio24 = this.convertir12hA24h(horario.hora_inicio);
            const fin24 = this.convertir12hA24h(horario.hora_fin);

            let horaActual = new Date(`2000-01-01T${inicio24}`);
            const horaFin = new Date(`2000-01-01T${fin24}`);

            while (horaActual < horaFin) {
            const horaStr = `${String(horaActual.getHours()).padStart(2, "0")}:${String(
                horaActual.getMinutes()
            ).padStart(2, "0")}:00`;

            horasDisponibles.push(this.convertir24hA12h(horaStr));
            horaActual.setMinutes(horaActual.getMinutes() + 30);
            }
        }

        const [citasDelDia, eventosDelDia] = await Promise.all([
            this.prisma.cita.findMany({
            where: {
                fecha: fechaConsulta, // CORREGIDO
                id_consultorio,
                status: {
                in: [StatusCitas.PROGRAMADA, StatusCitas.REPROGRAMADA],
                },
            },
            select: {
                hora_inicio: true,
                hora_fin: true,
            },
            }),

            this.prisma.evento.findMany({
            where: {
                id_consultorio,
                fecha_inicio: { lte: fechaConsulta }, // CORREGIDO
                fecha_fin: { gte: fechaConsulta },     // CORREGIDO
                status: StatusEvento.ACTIVO,
            },
            }),
        ]);

        if (eventosDelDia.some((e) => e.evento_todo_el_dia === "si")) {
            return {
            horasDisponibles: [],
            mensaje: "No hay horarios disponibles debido a un evento",
            };
        }

        const horasLibres = horasDisponibles.filter((horaDisp) => {
            const hora24 = this.convertir12hA24h(horaDisp);

            /** ---- A) Ocupada por cita ---- */
            const ocupadaPorCita = citasDelDia.some((cita) => {
            const inicioStr = this.formatearHoraDB(cita.hora_inicio) + ":00";
            const finStr = this.formatearHoraDB(cita.hora_fin) + ":00";
            return hora24 >= inicioStr && hora24 < finStr;
            });

            if (ocupadaPorCita) return false;

            /** ---- B) Ocupada por evento ---- */
            const ocupadaPorEvento = eventosDelDia.some((evento) => {
            if (!evento.hora_inicio || !evento.hora_fin) return false;

            return this.horaEnRango(horaDisp, evento.hora_inicio, evento.hora_fin);
            });

            return !ocupadaPorEvento;
        });

        return { horasDisponibles: horasLibres };
    }


    // LISTAR CITAS (CON FILTROS) 
//=====================================================================================================================================================
    async listarCitas2(filtros: {
        idUsuario: number;
        rol: 'paciente' | 'dentista';
        fecha?: string;
        status?: StatusCitas;
    }) {
        const where: any = {};

        if (filtros.rol === 'paciente') {
            const paciente = await this.prisma.paciente.findUnique({
                where: { id_usuario: filtros.idUsuario },
                select: { id_paciente: true, id_consultorio: true }
            });

            if (!paciente) throw new NotFoundException('Paciente no encontrado');

            // Paciente ve todas las citas de su consultorio
            where.id_consultorio = paciente.id_consultorio;
            where.id_paciente = paciente.id_paciente;
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
            select: {
                id_cita: true,
                fecha: true,
                hora_inicio: true,
                hora_fin: true,
                status: true,
                notas: true,
                paciente: { 
                    select: { 
                        id_paciente: true,
                        nombre: true,
                        apellido1: true,
                        apellido2: true
                    }
                },
                servicio: {
                    select: { nombre: true }
                },
                reprogramacion_cita: {
                    where: {
                        status: 'pendiente'
                    },
                    orderBy: {
                        fecha_solicitud: 'desc'
                    },
                    take: 1,  // Solo la más reciente
                    select: {
                        id_reprogramacion: true,
                        solicitada_por: true,
                        nueva_fecha: true,
                        nueva_hora: true,
                        nueva_hora_fin: true,
                        fecha_solicitud: true
                    }
                }
            },
            orderBy: { fecha: 'asc' }
        });

        const citasLimpias = citas
            .map(c => {
                const reprog = c.reprogramacion_cita[0]; // La más reciente

                // FILTRO: Si es reprogramada, verificar quién la solicitó
                if (c.status === 'reprogramada' && reprog) {
                    // Dentista solo ve las solicitadas por paciente
                    if (filtros.rol === 'dentista' && reprog.solicitada_por !== 'paciente') {
                        return null;
                    }
                    
                    // Paciente solo ve las solicitadas por dentista
                    if (filtros.rol === 'paciente' && reprog.solicitada_por !== 'dentista') {
                        return null;
                    }

                    // Si pasa el filtro, usar los NUEVOS datos de la reprogramación
                    return {
                        id_cita: c.id_cita,
                        id_reprogramacion: reprog.id_reprogramacion,
                        paciente: `${c.paciente.nombre} ${c.paciente.apellido1} ${c.paciente.apellido2 ?? ''}`.trim(),
                        servicio: c.servicio?.nombre ?? 'Sin servicio',
                        fecha: reprog.nueva_fecha.toISOString().split('T')[0], // Fecha NUEVA
                        hora_inicio: reprog.nueva_hora,                         // Hora NUEVA
                        hora_fin: reprog.nueva_hora_fin,                        // Hora fin NUEVA
                        notas: c.notas ?? '',
                        status: c.status,
                        solicitada_por: reprog.solicitada_por // Para mostrar quién solicitó
                    };
                }

                // Citas normales (no reprogramadas)
                return {
                    id_cita: c.id_cita,
                    paciente: `${c.paciente.nombre} ${c.paciente.apellido1} ${c.paciente.apellido2 ?? ''}`.trim(),
                    servicio: c.servicio?.nombre ?? 'Sin servicio',
                    fecha: c.fecha.toISOString().split('T')[0],
                    hora_inicio: c.hora_inicio,
                    hora_fin: c.hora_fin,
                    notas: c.notas ?? '',
                    status: c.status
                };
            })
            .filter(cita => cita !== null); //Eliminar las que no pasaron el filtro

        return citasLimpias;

        //return citas;
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
        //const fechaBusqueda = fecha ? new Date(fecha) : new Date();
        const fechaBusqueda = fecha ? this.convertirFechaSoloDia(fecha) : new Date();

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

//**************************************************************************************** */
// MÉTODO 1: Para el calendario (todas las citas del consultorio)
async listarCitasCalendario(filtros: {
    idUsuario: number;
    rol: 'paciente' | 'dentista';
}) {
    const where: any = {};

    if (filtros.rol === 'paciente') {
        const paciente = await this.prisma.paciente.findUnique({
            where: { id_usuario: filtros.idUsuario },
            select: { id_consultorio: true }
        });

        if (!paciente) throw new NotFoundException('Paciente no encontrado');
        
        // Solo filtrar por consultorio (todas las citas)
        where.id_consultorio = paciente.id_consultorio;
    }

    if (filtros.rol === 'dentista') {
        const id_consultorio = await this.obtenerConsultorioDentista(filtros.idUsuario);
        where.id_consultorio = id_consultorio;
    }

    // Solo citas que ocupan espacio en el calendario
    where.status = {
        in: ['programada']
    };

    const citas = await this.prisma.cita.findMany({
        where,
        select: {
            id_cita: true,
            fecha: true,
            hora_inicio: true,
            hora_fin: true,
            status: true,
            paciente: { 
                select: { 
                    id_paciente: true,
                    nombre: true,
                    apellido1: true,
                    apellido2: true
                }
            },
            reprogramacion_cita: {
                where: { status: 'pendiente' },
                orderBy: { fecha_solicitud: 'desc' },
                take: 1,
                select: {
                    nueva_fecha: true,
                    nueva_hora: true,
                    nueva_hora_fin: true,
                }
            }
        },
        orderBy: { fecha: 'asc' }
    });

    return citas.map(c => {
        const reprog = c.reprogramacion_cita[0];
        
        // Si está reprogramada, usar la fecha NUEVA
        if (c.status === 'reprogramada' && reprog) {
            return {
                id_cita: c.id_cita,
                fecha: reprog.nueva_fecha.toISOString().split('T')[0],
                hora_inicio: reprog.nueva_hora,
                hora_fin: reprog.nueva_hora_fin,
                status: c.status,
                paciente: filtros.rol === 'dentista' ? {
                    nombre: `${c.paciente.nombre} ${c.paciente.apellido1}`.trim()
                } : undefined
            };
        }

        // Cita normal
        return {
            id_cita: c.id_cita,
            fecha: c.fecha.toISOString().split('T')[0],
            hora_inicio: c.hora_inicio,
            hora_fin: c.hora_fin,
            status: c.status,
            paciente: filtros.rol === 'dentista' ? {
                nombre: `${c.paciente.nombre} ${c.paciente.apellido1}`.trim()
            } : undefined
        };
    });
}

// MÉTODO 2: Para la agenda/lista (citas filtradas con reprogramaciones)
async listarCitas(filtros: {
    idUsuario: number;
    rol: 'paciente' | 'dentista';
    fecha?: string;
    status?: StatusCitas;
}) {
    // Tu código actual se queda igual
    const where: any = {};

    if (filtros.rol === 'paciente') {
        const paciente = await this.prisma.paciente.findUnique({
            where: { id_usuario: filtros.idUsuario },
            select: { id_paciente: true, id_consultorio: true }
        });

        if (!paciente) throw new NotFoundException('Paciente no encontrado');

        // Paciente ve solo SUS citas
        where.id_consultorio = paciente.id_consultorio;
        where.id_paciente = paciente.id_paciente;
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
        select: {
            id_cita: true,
            fecha: true,
            hora_inicio: true,
            hora_fin: true,
            status: true,
            notas: true,
            paciente: { 
                select: { 
                    id_paciente: true,
                    nombre: true,
                    apellido1: true,
                    apellido2: true
                }
            },
            servicio: {
                select: { nombre: true }
            },
            reprogramacion_cita: {
                where: {
                    status: 'pendiente'
                },
                orderBy: {
                    fecha_solicitud: 'desc'
                },
                take: 1,
                select: {
                    id_reprogramacion: true,
                    solicitada_por: true,
                    nueva_fecha: true,
                    nueva_hora: true,
                    nueva_hora_fin: true,
                    fecha_solicitud: true
                }
            }
        },
        orderBy: { fecha: 'asc' }
    });

    const citasLimpias = citas
        .map(c => {
            const reprog = c.reprogramacion_cita[0];

            // FILTRO: Si es reprogramada, verificar quién la solicitó
            if (c.status === 'reprogramada' && reprog) {
                // Dentista solo ve las solicitadas por paciente
                if (filtros.rol === 'dentista' && reprog.solicitada_por !== 'paciente') {
                    return null;
                }
                
                // Paciente solo ve las solicitadas por dentista
                if (filtros.rol === 'paciente' && reprog.solicitada_por !== 'dentista') {
                    return null;
                }

                // Si pasa el filtro, usar los NUEVOS datos
                return {
                    id_cita: c.id_cita,
                    id_reprogramacion: reprog.id_reprogramacion,
                    paciente: `${c.paciente.nombre} ${c.paciente.apellido1} ${c.paciente.apellido2 ?? ''}`.trim(),
                    servicio: c.servicio?.nombre ?? 'Sin servicio',
                    fecha: reprog.nueva_fecha.toISOString().split('T')[0],
                    hora_inicio: reprog.nueva_hora,
                    hora_fin: reprog.nueva_hora_fin,
                    notas: c.notas ?? '',
                    status: c.status,
                    solicitada_por: reprog.solicitada_por
                };
            }

            // Citas normales
            return {
                id_cita: c.id_cita,
                paciente: `${c.paciente.nombre} ${c.paciente.apellido1} ${c.paciente.apellido2 ?? ''}`.trim(),
                servicio: c.servicio?.nombre ?? 'Sin servicio',
                fecha: c.fecha.toISOString().split('T')[0],
                hora_inicio: c.hora_inicio,
                hora_fin: c.hora_fin,
                notas: c.notas ?? '',
                status: c.status
            };
        })
        .filter(cita => cita !== null);

    return citasLimpias;
}



//==========================================================================================================================================    
    // OBTENER HISTORIAL DE CITAS (PACIENTE)
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
    async obtenerReprogramacionesPendientes(idUsuario: number, rol?: 'dentista' | 'paciente', id_consultorio?: number) {
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
                select: {
                    id_reprogramacion: true,
                    id_cita: true,
                    fecha_solicitud: true,
                    nueva_fecha: true,
                    nueva_hora: true,
                    solicitada_por: true,
                    cita: {
                        select: {
                            fecha: true,
                            hora_inicio: true,
                            paciente: {
                                select: {
                                    usuario: {
                                        select: {
                                            correo: true
                                        }
                                    }
                                }
                            },
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
            //await this.validarDisponibilidad(fecha, horaInicio, idConsultorio, idCitaExcluir);
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
        const fechaLocal = this.convertirFechaSoloDia(fecha);
        const [citas, eventos] = await Promise.all([
            this.prisma.cita.findMany({
                where: {
                    fecha: this.convertirFechaSoloDia(fecha),
                    id_consultorio: idConsultorio,
                    status: { in: [StatusCitas.PROGRAMADA, StatusCitas.REPROGRAMADA] }
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
                    fecha_inicio: { lte: fechaLocal },
                    fecha_fin: { gte: fechaLocal },
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

        /*const horariosOcupados = citas.map(c => ({
            hora: this.formatearHoraDB(c.hora_inicio),
            tipo: 'cita',
            descripcion: c.motivo_consulta?.nombre ?? 'Sin motivo'
        }));*/
        const horariosOcupados = citas.map(c => {
            const horaLocal24 = this.extraerHoraLocal(c.hora_inicio); // ← REAL timezone
            const hora12 = this.convertir24hA12h(horaLocal24);

            return {
                hora: hora12,
                tipo: 'cita',
                descripcion: c.motivo_consulta?.nombre ?? 'Sin motivo'
            };
        });

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
    
    //Valida que no haya conflictos con otras citas
    private async validarDisponibilidad(
        fecha: string, 
        hora_inicio: string, 
        hora_fin: string,
        id_consultorio: number,
        id_cita_excluir?: number
    ) {
        // Convertir a DateTime completos
        const horaInicioDate = this.convertirHoraADateTime(fecha, hora_inicio);
        const horaFinDate = this.convertirHoraADateTime(fecha, hora_fin);

        const citasConflicto = await this.prisma.cita.findFirst({
            where: {
            id_consultorio,
            fecha: this.convertirFechaSoloDia(fecha),
            status: { 
                in: [StatusCitas.PROGRAMADA, ] 
            },
            ...(id_cita_excluir && { id_cita: { not: id_cita_excluir } }),
            OR: [
                // Caso 1: La nueva cita inicia durante una cita existente
                {
                AND: [
                    { hora_inicio: { lte: horaInicioDate } },
                    { hora_fin: { gt: horaInicioDate } }
                ]
                },
                // Caso 2: La nueva cita termina durante una cita existente
                {
                AND: [
                    { hora_inicio: { lt: horaFinDate } },
                    { hora_fin: { gte: horaFinDate } }
                ]
                },
                // Caso 3: La nueva cita envuelve completamente una cita existente
                {
                AND: [
                    { hora_inicio: { gte: horaInicioDate } },
                    { hora_fin: { lte: horaFinDate } }
                ]
                }
            ]
            }
        });

        if (citasConflicto) {
            throw new ConflictException(`Ya existe una cita programada en ese horario.`);   //(${this.formatearHoraDB(citasConflicto.hora_inicio)} - ${this.formatearHoraDB(citasConflicto.hora_fin)})
        }
    }

    //Valida que no haya eventos bloqueando el horario
    private async validarEventos(
        fecha: string,
        hora_inicio: string,
        hora_fin: string,
        id_consultorio: number
    ) {
        const fechaLocal = this.convertirFechaSoloDia(fecha);
        
        // Buscar eventos que intersectan con la fecha de la cita
        const eventosDelDia = await this.prisma.evento.findMany({
            where: {
                id_consultorio,
                // El evento debe abarcar la fecha de la cita
                fecha_inicio: { lte: fechaLocal },
                fecha_fin: { gte: fechaLocal },
                status: StatusEvento.ACTIVO
            },
            include: {
                tipo_evento: true
            }
        });

        // Si no hay eventos, no hay bloqueos
        if (eventosDelDia.length === 0) {
            return;
        }

        for (const evento of eventosDelDia) {
            // CASO 1: Evento de todo el día
            if (evento.evento_todo_el_dia === 'si') {
                throw new BadRequestException(
                    `No se pueden agendar citas debido al evento programado de todo el día: "${evento.titulo}"`
                );
            }

            // CASO 2: Evento con horario específico
            if (evento.hora_inicio && evento.hora_fin) {
                const fechaCita = this.convertirFechaSoloDia(fecha);
                const fechaInicioEvento = new Date(evento.fecha_inicio);
                const fechaFinEvento = new Date(evento.fecha_fin);

                // Normalizar fechas a medianoche para comparación
                fechaCita.setHours(0, 0, 0, 0);
                fechaInicioEvento.setHours(0, 0, 0, 0);
                fechaFinEvento.setHours(0, 0, 0, 0);

                const esPrimerDia = fechaCita.getTime() === fechaInicioEvento.getTime();
                const esUltimoDia = fechaCita.getTime() === fechaFinEvento.getTime();
                const esDiaIntermedio = fechaCita > fechaInicioEvento && fechaCita < fechaFinEvento;

                // CASO 2A: Día intermedio del evento (bloquea todo)
                if (esDiaIntermedio) {
                    throw new BadRequestException(
                        `No se pueden agendar citas hay un evento programado`
                    );
                }

                // CASO 2B: Primer día del evento (bloquea desde hora_inicio en adelante)
                if (esPrimerDia) {
                    const citaInicio24 = this.convertirA24h(hora_inicio);
                    const citaFin24 = this.convertirA24h(hora_fin);
                    const eventoInicio24 = this.convertirA24h(evento.hora_inicio);

                    // Si la cita empieza antes de que termine el evento
                    if (citaInicio24 >= eventoInicio24 || citaFin24 > eventoInicio24) {
                        throw new BadRequestException(
                            `El horario está bloqueado por un evento`
                        );
                    }
                }

                // CASO 2C: Último día del evento (bloquea hasta hora_fin)
                if (esUltimoDia) {
                    const citaInicio24 = this.convertirA24h(hora_inicio);
                    const citaFin24 = this.convertirA24h(hora_fin);
                    const eventoFin24 = this.convertirA24h(evento.hora_fin);

                    // Si la cita termina después de que empiece el último día
                    if (citaFin24 <= eventoFin24 || citaInicio24 < eventoFin24) {
                        throw new BadRequestException(
                            `El horario está bloqueado por un evento`
                        );
                    }
                }

                // CASO 2D: Evento de un solo día con horario específico
                if (esPrimerDia && esUltimoDia) {
                    const citaInicio24 = this.convertirA24h(hora_inicio);
                    const citaFin24 = this.convertirA24h(hora_fin);
                    const eventoInicio24 = this.convertirA24h(evento.hora_inicio);
                    const eventoFin24 = this.convertirA24h(evento.hora_fin);

                    const hayTraslape = this.verificarTraslapeHorarios(
                        citaInicio24,
                        citaFin24,
                        eventoInicio24,
                        eventoFin24
                    );

                    if (hayTraslape) {
                        throw new BadRequestException(
                            `El horario está bloqueado por un evento`
                        );
                    }
                }
            }
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
        return new Date(fecha).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true
        });
    }


    private formatearFechaDB(fecha: Date): string {
        return fecha.toISOString().split('T')[0];
    }

    //Formatea una fecha a DD/MM/YYYY
    private formatearFecha(fecha: Date): string {
        const dia = String(fecha.getDate()).padStart(2, '0');
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const año = fecha.getFullYear();
        return `${dia}/${mes}/${año}`;
    }

    private convertirFechaSoloDia(fecha: string): Date {
        const [y, m, d] = fecha.split("-").map(Number);
        return new Date(y, m - 1, d); // esto NO desfasa
    }

    private extraerHoraLocal(dateObj: Date): string {
        const horas = dateObj.getHours().toString().padStart(2, "0");
        const minutos = dateObj.getMinutes().toString().padStart(2, "0");
        return `${horas}:${minutos}`; // → "09:00"
    }

    private convertirA24h(hora: string): string {
        // Si ya tiene AM/PM, usar el método existente
        if (hora.includes('AM') || hora.includes('PM')) {
            return this.convertir12hA24h(hora);
        }
        
        // Si ya está en formato 24h, normalizarlo a HH:MM:SS
        const match = hora.trim().match(/^(\d{1,2}):(\d{2})(:\d{2})?$/);
        if (match) {
            const [_, horas, minutos] = match;
            return `${horas.padStart(2, '0')}:${minutos.padStart(2, '0')}:00`;
        }
        
        throw new BadRequestException(`Formato de hora inválido: ${hora}`);
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
