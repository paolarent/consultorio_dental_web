import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateEventoDto } from './dto/create-evento.dto';
import { Status, StatusEvento } from 'src/common/enums';
import { status_evento } from '@prisma/client';
import { UpdateEventoDto } from './dto/update-evento.dto';

@Injectable()
export class EventoService {
    constructor( private prisma: PrismaService ) {}

    async listarEventosActivos(id_consultorio: number) {
        return this.prisma.evento.findMany({
            where: {
                id_consultorio,
                status: StatusEvento.ACTIVO
            },
            include: {
                tipo_evento: true
            },
                orderBy: {
                fecha_inicio: 'asc'
            }
        });
    }

    async obtenerEvento(id_evento: number, id_consultorio: number) {
        const evento = await this.prisma.evento.findUnique({
            where: { id_evento },
            include: {
                tipo_evento: true
            }
        });

        if (!evento) {
            throw new Error('Evento no encontrado');
        }

        if (evento.id_consultorio !== id_consultorio) {
            throw new Error('No tienes permiso para ver este evento');
        }

        return evento;
    }


    async listarTiposEvento() {
        return this.prisma.tipo_evento.findMany({
            where: { status: Status.ACTIVO },
            select: {
                id_tipo_evento: true,
                nombre: true
            },
                orderBy: {
                id_tipo_evento: 'asc'
            }
        });
    }

    
    async createEvento(data: CreateEventoDto, id_consultorio: number) { 
        const tipoEvento = await this.prisma.tipo_evento.findUnique({
            where: {id_tipo_evento: data.id_tipo_evento}
        });

        if (!tipoEvento) throw new Error('Tipo de evento no encontrado');

        if (tipoEvento.id_consultorio !== id_consultorio) {
            throw new Error('El tipo de evento no pertenece al consultorio seleccionado');
        }

        // VALIDAR QUE NO INTERFIERA CON OTROS EVENTOS
        await this.validarEventosExistentes(
            new Date(data.fecha_inicio),
            new Date(data.fecha_fin),
            data.hora_inicio || null,
            data.hora_fin || null,
            data.evento_todo_el_dia,
            id_consultorio
        );

        // VALIDAR QUE NO INTERFIERA CON CITAS PROGRAMADAS
        await this.validarCitasProgramadas(
            new Date(data.fecha_inicio),
            new Date(data.fecha_fin),
            data.hora_inicio || null,
            data.hora_fin || null,
            data.evento_todo_el_dia,
            id_consultorio
        );

        return this.prisma.evento.create({
            data: {
                ...data,
                fecha_inicio: new Date(data.fecha_inicio), 
                fecha_fin: new Date(data.fecha_fin),  
                id_consultorio,
                status: StatusEvento.ACTIVO,
            },
        });
    }

    async updateEventoCompleto(
        id_evento: number, 
        data: UpdateEventoDto, 
        id_consultorio: number
    ) {
        // Verificar que el evento existe y pertenece al consultorio
        const eventoExistente = await this.prisma.evento.findUnique({
            where: { id_evento }
        });

        if (!eventoExistente) {
            throw new Error('Evento no encontrado');
        }

        if (eventoExistente.id_consultorio !== id_consultorio) {
            throw new Error('No tienes permiso para editar este evento');
        }

        // Si se está actualizando el tipo de evento, validarlo
        if (data.id_tipo_evento) {
            const tipoEvento = await this.prisma.tipo_evento.findUnique({
                where: { id_tipo_evento: data.id_tipo_evento }
            });

            if (!tipoEvento) {
                throw new Error('Tipo de evento no encontrado');
            }

            if (tipoEvento.id_consultorio !== id_consultorio) {
                throw new Error('El tipo de evento no pertenece a tu consultorio');
            }
        }

        // Preparar datos para actualizar
        const updateData: any = {};

        if (data.titulo !== undefined) updateData.titulo = data.titulo;
        if (data.id_tipo_evento !== undefined) updateData.id_tipo_evento = data.id_tipo_evento;
        if (data.fecha_inicio !== undefined) updateData.fecha_inicio = new Date(data.fecha_inicio);
        if (data.fecha_fin !== undefined) updateData.fecha_fin = new Date(data.fecha_fin);

        if (data.evento_todo_el_dia !== undefined) {
            updateData.evento_todo_el_dia = data.evento_todo_el_dia;

            if (data.evento_todo_el_dia === 'si') {
                updateData.hora_inicio = null;
                updateData.hora_fin = null;
            } else {
                if (data.hora_inicio !== undefined) updateData.hora_inicio = data.hora_inicio;
                if (data.hora_fin !== undefined) updateData.hora_fin = data.hora_fin;
            }
        } else {
            if (data.hora_inicio !== undefined) updateData.hora_inicio = data.hora_inicio;
            if (data.hora_fin !== undefined) updateData.hora_fin = data.hora_fin;
        }

        if (data.notas !== undefined) updateData.notas = data.notas;

        // VALIDAR QUE NO INTERFIERA CON OTROS EVENTOS
        await this.validarEventosExistentes(
            updateData.fecha_inicio || eventoExistente.fecha_inicio,
            updateData.fecha_fin || eventoExistente.fecha_fin,
            updateData.hora_inicio !== undefined ? updateData.hora_inicio : eventoExistente.hora_inicio,
            updateData.hora_fin !== undefined ? updateData.hora_fin : eventoExistente.hora_fin,
            updateData.evento_todo_el_dia || eventoExistente.evento_todo_el_dia,
            id_consultorio,
            id_evento // Excluir el evento actual de la validación
        );

        // VALIDAR QUE NO INTERFIERA CON CITAS PROGRAMADAS
        await this.validarCitasProgramadas(
            updateData.fecha_inicio || eventoExistente.fecha_inicio,
            updateData.fecha_fin || eventoExistente.fecha_fin,
            updateData.hora_inicio !== undefined ? updateData.hora_inicio : eventoExistente.hora_inicio,
            updateData.hora_fin !== undefined ? updateData.hora_fin : eventoExistente.hora_fin,
            updateData.evento_todo_el_dia || eventoExistente.evento_todo_el_dia,
            id_consultorio,
            id_evento // Excluir el evento actual de la validación
        );

        return this.prisma.evento.update({
            where: { id_evento },
            data: updateData
        });
    }


    async updateStatusEvento(id_evento: number, nuevoStatus: status_evento) {
        return this.prisma.evento.update({
            where: { id_evento },
            data: { status: nuevoStatus }
        });
    }

    //LOGICA DE VALIDACIONES
    private async validarCitasProgramadas(
        fecha_inicio: Date,
        fecha_fin: Date,
        hora_inicio: string | null,
        hora_fin: string | null,
        evento_todo_el_dia: 'si' | 'no',
        id_consultorio: number,
        id_evento_excluir?: number
    ) {
        // Buscar citas programadas que puedan interferir
        const citasProgramadas = await this.prisma.cita.findMany({
            where: {
                id_consultorio,
                status: 'programada', // Solo citas programadas tienen fecha fija
                fecha: {
                    gte: fecha_inicio,
                    lte: fecha_fin
                }
            },
        });

        if (citasProgramadas.length === 0) {
            return; // No hay conflictos
        }

        // Validar cada cita
        for (const cita of citasProgramadas) {
            const fechaCita = new Date(cita.fecha);
            
            // CASO 1: Evento de todo el día
            if (evento_todo_el_dia === 'si') {
                throw new BadRequestException(
                    `El evento interfiere con una cita programada`
                );
            }

            // CASO 2: Evento con horario específico
            if (hora_inicio && hora_fin) {
                const fechaInicioEvento = new Date(fecha_inicio);
                const fechaFinEvento = new Date(fecha_fin);

                // Normalizar fechas a medianoche
                fechaCita.setHours(0, 0, 0, 0);
                fechaInicioEvento.setHours(0, 0, 0, 0);
                fechaFinEvento.setHours(0, 0, 0, 0);

                const esPrimerDia = fechaCita.getTime() === fechaInicioEvento.getTime();
                const esUltimoDia = fechaCita.getTime() === fechaFinEvento.getTime();
                const esDiaIntermedio = fechaCita > fechaInicioEvento && fechaCita < fechaFinEvento;

                // CASO 2A: Día intermedio (bloquea cualquier cita)
                if (esDiaIntermedio) {
                    throw new BadRequestException(
                        `El evento interfiere con una cita programada`
                    );
                }

                // Convertir horas de la cita (vienen en Timetz)
                const citaHoraInicio = this.extraerHoraDeCita(cita.hora_inicio);
                const citaHoraFin = this.extraerHoraDeCita(cita.hora_fin);

                // CASO 2B: Primer día del evento
                if (esPrimerDia) {
                    const eventoInicio24 = this.convertirA24h(hora_inicio);
                    const citaInicio24 = citaHoraInicio;
                    const citaFin24 = citaHoraFin;

                    // Si la cita empieza después o durante el inicio del evento
                    if (citaInicio24 >= eventoInicio24 || citaFin24 > eventoInicio24) {
                        throw new BadRequestException(
                            `El evento interfiere con una cita programada.`
                        );
                    }
                }

                // CASO 2C: Último día del evento
                if (esUltimoDia) {
                    const eventoFin24 = this.convertirA24h(hora_fin);
                    const citaInicio24 = citaHoraInicio;
                    const citaFin24 = citaHoraFin;

                    // Si la cita termina antes o durante el fin del evento
                    if (citaFin24 <= eventoFin24 || citaInicio24 < eventoFin24) {
                        throw new BadRequestException(
                            `El evento interfiere con una cita programada`
                        );
                    }
                }

                // CASO 2D: Evento de un solo día
                if (esPrimerDia && esUltimoDia) {
                    const eventoInicio24 = this.convertirA24h(hora_inicio);
                    const eventoFin24 = this.convertirA24h(hora_fin);
                    const citaInicio24 = citaHoraInicio;
                    const citaFin24 = citaHoraFin;

                    const hayTraslape = this.verificarTraslapeHorarios(
                        eventoInicio24,
                        eventoFin24,
                        citaInicio24,
                        citaFin24
                    );

                    if (hayTraslape) {
                        
                        throw new BadRequestException(
                            `El evento interfiere con una cita programada`
                        );
                    }
                }
            }
        }
    }

    //Extrae la hora en formato HH:MM:SS de un campo Timetz de Prisma
    //Prisma devuelve timetz como string: "16:00:00+00:00"
    private extraerHoraDeCita(horaTimetz: any): string {
        // Si viene como string "16:00:00+00:00", extraer solo la parte de la hora
        if (typeof horaTimetz === 'string') {
            const horaSinZona = horaTimetz.split('+')[0].split('-')[0]; // Eliminar zona horaria
            return horaSinZona; // Ya está en formato HH:MM:SS
        }
        
        // Si viene como Date (por si acaso)
        if (horaTimetz instanceof Date) {
            const hora = horaTimetz.getHours().toString().padStart(2, '0');
            const minutos = horaTimetz.getMinutes().toString().padStart(2, '0');
            const segundos = horaTimetz.getSeconds().toString().padStart(2, '0');
            return `${hora}:${minutos}:${segundos}`;
        }
        
        throw new BadRequestException(`Formato de hora de cita inválido: ${horaTimetz}`);
    }

    //Verifica si dos rangos de horarios se traslapan
    private verificarTraslapeHorarios(
        inicio1: string,
        fin1: string,
        inicio2: string,
        fin2: string
    ): boolean {
        return inicio1 < fin2 && fin1 > inicio2;
    }


    //Convierte hora a formato 24h normalizado (HH:MM:SS)
    private convertirA24h(hora: string): string {
        // Si ya tiene AM/PM
        if (hora.includes('AM') || hora.includes('PM')) {
            return this.convertir12hA24h(hora);
        }
        
        // Si ya está en formato 24h, normalizarlo
        const match = hora.trim().match(/^(\d{1,2}):(\d{2})(:\d{2})?$/);
        if (match) {
            const [_, horas, minutos] = match;
            return `${horas.padStart(2, '0')}:${minutos.padStart(2, '0')}:00`;
        }
        
        throw new BadRequestException(`Formato de hora inválido: ${hora}`);
    }


    //Convierte hora 12h (8:00 AM) a 24h (08:00:00)
    private convertir12hA24h(hora12h: string): string {
        const match = hora12h.trim().match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (!match) {
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

    private async validarEventosExistentes(
        fecha_inicio: Date,
        fecha_fin: Date,
        hora_inicio: string | null,
        hora_fin: string | null,
        evento_todo_el_dia: 'si' | 'no',
        id_consultorio: number,
        id_evento_excluir?: number
    ) {
        // Buscar eventos activos que puedan interferir
        const eventosExistentes = await this.prisma.evento.findMany({
            where: {
                id_consultorio,
                status: StatusEvento.ACTIVO,
                // Excluir el evento actual si estamos editando
                ...(id_evento_excluir && { id_evento: { not: id_evento_excluir } }),
                // Buscar eventos que se traslapen en fechas
                OR: [
                    {
                        // Eventos que empiezan durante el nuevo evento
                        fecha_inicio: {
                            gte: fecha_inicio,
                            lte: fecha_fin
                        }
                    },
                    {
                        // Eventos que terminan durante el nuevo evento
                        fecha_fin: {
                            gte: fecha_inicio,
                            lte: fecha_fin
                        }
                    },
                    {
                        // Eventos que abarcan completamente el nuevo evento
                        AND: [
                            { fecha_inicio: { lte: fecha_inicio } },
                            { fecha_fin: { gte: fecha_fin } }
                        ]
                    }
                ]
            },
            include: {
                tipo_evento: true
            }
        });

        if (eventosExistentes.length === 0) {
            return; // No hay conflictos
        }

        // Validar cada evento existente
        for (const eventoExistente of eventosExistentes) {
            // CASO 1: El nuevo evento es de todo el día
            if (evento_todo_el_dia === 'si') {
                // Si el nuevo evento es de todo el día, bloquea cualquier día que se traslape
                throw new BadRequestException(
                    `Ya existe el evento "${eventoExistente.titulo}" (${this.formatearFecha(eventoExistente.fecha_inicio)} - ${this.formatearFecha(eventoExistente.fecha_fin)}) que interfiere con las fechas seleccionadas`
                );
            }

        
            // CASO 2: El evento existente es de todo el día
            if (eventoExistente.evento_todo_el_dia === 'si') {
                throw new BadRequestException(
                    `Ya existe el evento de todo el día "${eventoExistente.titulo}" (${this.formatearFecha(eventoExistente.fecha_inicio)} - ${this.formatearFecha(eventoExistente.fecha_fin)}) que bloquea estas fechas`
                );
            }

            
            // CASO 3: Ambos eventos tienen horarios específicos
            if (hora_inicio && hora_fin && eventoExistente.hora_inicio && eventoExistente.hora_fin) {
                const resultado = this.verificarTraslapeEntreEventos(
                    fecha_inicio,
                    fecha_fin,
                    hora_inicio,
                    hora_fin,
                    eventoExistente.fecha_inicio,
                    eventoExistente.fecha_fin,
                    eventoExistente.hora_inicio,
                    eventoExistente.hora_fin
                );

                if (resultado.hayTraslape) {
                    throw new BadRequestException(
                        `El evento interfiere con "${eventoExistente.titulo}" ${resultado.mensaje}`
                    );
                }
            }
        }
    }


    //Verifica si dos eventos con horarios específicos se traslapan
    //Considera eventos de un día, multi-día, y todos los casos intermedios
    private verificarTraslapeEntreEventos(
        fecha1_inicio: Date,
        fecha1_fin: Date,
        hora1_inicio: string,
        hora1_fin: string,
        fecha2_inicio: Date,
        fecha2_fin: Date,
        hora2_inicio: string,
        hora2_fin: string
    ): { hayTraslape: boolean; mensaje: string } {
        
        // Normalizar fechas a medianoche para comparación
        const f1_inicio = new Date(fecha1_inicio);
        const f1_fin = new Date(fecha1_fin);
        const f2_inicio = new Date(fecha2_inicio);
        const f2_fin = new Date(fecha2_fin);
        
        f1_inicio.setHours(0, 0, 0, 0);
        f1_fin.setHours(0, 0, 0, 0);
        f2_inicio.setHours(0, 0, 0, 0);
        f2_fin.setHours(0, 0, 0, 0);

        // Obtener todas las fechas que abarca cada evento
        const fechasEvento1 = this.obtenerFechasEnRango(f1_inicio, f1_fin);
        const fechasEvento2 = this.obtenerFechasEnRango(f2_inicio, f2_fin);

        // Encontrar fechas que se traslapan
        const fechasComunes = fechasEvento1.filter(f1 => 
            fechasEvento2.some(f2 => f1.getTime() === f2.getTime())
        );

        if (fechasComunes.length === 0) {
            return { hayTraslape: false, mensaje: '' };
        }

        // Convertir horas a formato 24h
        const h1_inicio_24 = this.convertirA24h(hora1_inicio);
        const h1_fin_24 = this.convertirA24h(hora1_fin);
        const h2_inicio_24 = this.convertirA24h(hora2_inicio);
        const h2_fin_24 = this.convertirA24h(hora2_fin);

        // Verificar cada fecha común
        for (const fechaComun of fechasComunes) {
            // Determinar qué rango de horas aplica para cada evento en esta fecha
            const rangoEvento1 = this.obtenerRangoHorarioPorFecha(
                fechaComun, f1_inicio, f1_fin, h1_inicio_24, h1_fin_24
            );
            const rangoEvento2 = this.obtenerRangoHorarioPorFecha(
                fechaComun, f2_inicio, f2_fin, h2_inicio_24, h2_fin_24
            );

            // Si algún evento bloquea todo el día en esa fecha
            if (rangoEvento1.todoElDia || rangoEvento2.todoElDia) {
                return {
                    hayTraslape: true,
                    mensaje: `el ${this.formatearFecha(fechaComun)}`
                };
            }

            // Verificar traslape de horarios
            const hayTraslapeHorario = this.verificarTraslapeHorarios(
                rangoEvento1.horaInicio,
                rangoEvento1.horaFin,
                rangoEvento2.horaInicio,
                rangoEvento2.horaFin
            );

            if (hayTraslapeHorario) {
                return {
                    hayTraslape: true,
                    mensaje: `el ${this.formatearFecha(fechaComun)} (${rangoEvento2.horaInicio.substring(0, 5)} - ${rangoEvento2.horaFin.substring(0, 5)})`
                };
            }
        }

        return { hayTraslape: false, mensaje: '' };
    }


    //Obtiene el rango horario que aplica para un evento en una fecha específica
    //Considera si es el primer día, último día o día intermedio del evento
    private obtenerRangoHorarioPorFecha(
        fecha: Date,
        fechaInicio: Date,
        fechaFin: Date,
        horaInicio: string,
        horaFin: string
    ): { horaInicio: string; horaFin: string; todoElDia: boolean } {
        
        const esPrimerDia = fecha.getTime() === fechaInicio.getTime();
        const esUltimoDia = fecha.getTime() === fechaFin.getTime();
        const esDiaIntermedio = fecha > fechaInicio && fecha < fechaFin;

        // Día intermedio = todo el día bloqueado
        if (esDiaIntermedio) {
            return {
                horaInicio: '00:00:00',
                horaFin: '23:59:59',
                todoElDia: true
            };
        }

        // Primer día = desde hora_inicio hasta fin del día
        if (esPrimerDia && !esUltimoDia) {
            return {
                horaInicio: horaInicio,
                horaFin: '23:59:59',
                todoElDia: false
            };
        }

        // Último día = desde inicio del día hasta hora_fin
        if (esUltimoDia && !esPrimerDia) {
            return {
                horaInicio: '00:00:00',
                horaFin: horaFin,
                todoElDia: false
            };
        }

        // Mismo día (primer y último día) = rango exacto
        if (esPrimerDia && esUltimoDia) {
            return {
                horaInicio: horaInicio,
                horaFin: horaFin,
                todoElDia: false
            };
        }

        // Caso por defecto (no debería llegar aquí)
        return {
            horaInicio: '00:00:00',
            horaFin: '23:59:59',
            todoElDia: true
        };
    }


    //Obtiene un array de todas las fechas entre fecha_inicio y fecha_fin (inclusivo)
    private obtenerFechasEnRango(fechaInicio: Date, fechaFin: Date): Date[] {
        const fechas: Date[] = [];
        const fechaActual = new Date(fechaInicio);
        
        while (fechaActual <= fechaFin) {
            fechas.push(new Date(fechaActual));
            fechaActual.setDate(fechaActual.getDate() + 1);
        }
        
        return fechas;
    }


    //Formatea una fecha a DD/MM/YYYY
    private formatearFecha(fecha: Date): string {
        const dia = String(fecha.getDate()).padStart(2, '0');
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const año = fecha.getFullYear();
        return `${dia}/${mes}/${año}`;
    }

}
