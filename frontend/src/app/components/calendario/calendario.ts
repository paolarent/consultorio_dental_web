import { Component, OnInit, signal } from '@angular/core';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import esLocale from '@fullcalendar/core/locales/es';
import { HorarioService } from '../../services/horario.service';
import { CitaService } from '../../services/cita.service';
import { AuthService } from '../../auth/auth.service';
import { ModalSolicCita } from '../modal-solic-cita/modal-solic-cita';
import { ModalCreateCita } from '../modal-create-cita/modal-create-cita';

@Component({
  selector: 'app-calendario',
  imports: [FullCalendarModule, ModalSolicCita, ModalCreateCita],
  templateUrl: './calendario.html',
  styleUrl: './calendario.css'
})
export class Calendario implements OnInit {
  modalSolicCita = signal(false);
  modalCrearCita = signal(false);
  // Signals para fecha y hora seleccionada
  fechaSeleccionada = signal('');
  horaSeleccionada = signal('');

  constructor(
    private horarioService: HorarioService,
    private citaService: CitaService,
    private authService: AuthService // Para saber si es dentista o paciente
  ) {}

  private rolUsuario: 'dentista' | 'paciente' = 'dentista'; // Se obtiene del auth

  calendarOptions: any = {
    locales: [esLocale],
    locale: 'es',
    initialView: 'timeGridWeek',
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    buttonText: {
      today: 'Hoy',
      month: 'Mes',
      week: 'Semana',
      day: 'Día'
    },
    allDaySlot: false,
    slotDuration: '00:30:00',
    slotLabelInterval: '01:00',
    slotLabelFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    },
    height: 'auto',
    contentHeight: 600,
    nowIndicator: true,
    slotMinTime: '06:00:00',
    slotMaxTime: '22:00:00',
    selectConstraint: { className: 'horario-disponible' },
    selectOverlap: false,
    selectable: true,
    selectMirror: true,
    validRange: (nowDate: Date) => ({
      start: nowDate // solo hoy en adelante
    }),
    dateClick: this.onCellClick.bind(this),
    //Detectar cambio de vista para recargar citas
    datesSet: this.onViewChange.bind(this),
    events: []
  };

  ngOnInit() {
    const usuario = this.authService.usuario();
    
    if (usuario?.rol) {
      this.rolUsuario = usuario.rol as 'dentista' | 'paciente';
      console.log("Usuario autenticado:", {
        rol: this.rolUsuario,
      });
    } else {
      console.error("No se pudo obtener el rol del usuario");
    }
    
    this.cargarHorario();
  }


  // CARGAR HORARIO
  cargarHorario() {
    this.horarioService.obtenerHorario().subscribe(horarios => {
      console.log("Horarios recibidos:", horarios);

      if (!horarios || horarios.length === 0) {
        console.warn("No hay horarios disponibles");
        return;
      }

      const horasInicio = horarios.map(h => this.toNumber(h.hora_inicio));
      const horasFin = horarios.map(h => this.toNumber(h.hora_fin));
      const minInicio = Math.min(...horasInicio);
      const maxFin = Math.max(...horasFin);

      // Eventos de disponibilidad (verde/celeste)
      const eventosDisponibles = horarios.map(h => ({
        daysOfWeek: [h.dia],
        startTime: this.to24(h.hora_inicio),
        endTime: this.to24(h.hora_fin),
        display: "background",
        color: "#1c9a9cff",
        classNames: ['horario-disponible'],
        groupId: 'horario-disponible'
      }));

      // Eventos de bloqueo (gris)
      const eventosBloqueados = this.crearEventosBloqueados(horarios, minInicio, maxFin);

      const slotMinTime = `${minInicio.toString().padStart(2, '0')}:00:00`;
      const slotMaxTime = `${maxFin.toString().padStart(2, '0')}:00:00`;

      //GUARDAR eventos base para después agregar citas
      this.calendarOptions = {
        ...this.calendarOptions,
        slotMinTime,
        slotMaxTime,
        events: [...eventosDisponibles, ...eventosBloqueados]
      };

      //Cargar citas después de tener los horarios
      this.cargarTodasCitas();
    });
  }

  // CARGAR CITAS DE LA SEMANA/MES VISIBLE
  onViewChange(info: any) {
    console.log("Vista cambiada:", info.view.type);
  }


  // CARGAR CITAS Y CONVERTIRLAS A EVENTOS
  cargarTodasCitas() {
    this.citaService.listarCitasCalendario().subscribe({
      next: (citas) => {
        const eventosCitas = citas.map(cita => {
          const fecha = cita.fecha.split('T')[0];
          const horaInicio = this.extraerHora(cita.hora_inicio);
          const horaFin = this.extraerHora(cita.hora_fin);

          return {
            id: `cita-${cita.id_cita}`,
            start: `${fecha}T${horaInicio}:00`,
            end: `${fecha}T${horaFin}:00`,
            display: 'background',
            color: '#991616', // rojo ocupado
            classNames: ['cita-ocupada'],
            extendedProps: {
              tipo: 'cita',
              status: cita.status,
              paciente: this.rolUsuario === 'dentista' ? cita.paciente?.nombre : undefined
            }
          };
        });

        this.actualizarEventosCalendario(eventosCitas);
      },
      error: (err) => console.error('Error cargando citas:', err)
    });
  }


  // ============================================
  // CONVERTIR CITAS A EVENTOS DE BLOQUEO
  // ============================================
  convertirCitasAEventos(citas: any[]): any[] {
    return citas.map(cita => {
      const fecha = cita.fecha.split('T')[0]; // "2025-11-28"
      const horaInicio = this.extraerHora(cita.hora_inicio); // "10:00"
      const horaFin = this.extraerHora(cita.hora_fin); // "10:30"

      return {
        id: `cita-${cita.id_cita}`,
        start: `${fecha}T${horaInicio}:00`,
        end: `${fecha}T${horaFin}:00`,
        display: "background", // Bloquea la celda
        color: this.obtenerColorPorStatus(cita.status),
        classNames: [`cita-ocupada`, `cita-${cita.status}`],
        extendedProps: {
          tipo: 'cita',
          citaId: cita.id_cita,
          paciente: cita.paciente?.nombre,
          status: cita.status
        }
      };
    });
  }

  // ============================================
  // ACTUALIZAR EVENTOS DEL CALENDARIO
  // ============================================
  actualizarEventosCalendario(eventosCitas: any[]) {
    // Obtener eventos base (horarios disponibles y bloqueados)
    const eventosBase = this.calendarOptions.events.filter(
      (e: any) => e.classNames?.includes('horario-disponible') || 
                  e.classNames?.includes('horario-bloqueado')
    );

    // Combinar con citas
    this.calendarOptions = {
      ...this.calendarOptions,
      events: [...eventosBase, ...eventosCitas]
    };

    console.log(`Calendario actualizado con ${eventosCitas.length} citas`);
  }

  // ============================================
  // HELPERS PARA PROCESAR CITAS
  // ============================================

  // Extrae hora en formato HH:MM desde DateTime
  extraerHora(dateTime: string | Date): string {
    if (!dateTime) return '00:00';
    
    const fecha = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
    
    const horas = fecha.getHours().toString().padStart(2, '0');
    const minutos = fecha.getMinutes().toString().padStart(2, '0');
    
    return `${horas}:${minutos}`;
  }
  

  // Color según status de la cita
  obtenerColorPorStatus(status: string): string {
    const colores: { [key: string]: string } = {
      'programada': '#620303ff',    // Rojo (ocupado)
      //'pendiente': '#06879bff',     // Amarillo (pendiente de confirmar)
      'completada': '#005effff',    // Gris claro (pasada)
      //'cancelada': '#26ac45ff',     // Gris muy claro (cancelada)
      //'reprogramada': '#b723d4ff'   // Amarillo (en proceso)
    };
    
    return colores[status] || '#c91a8cff';
  }

  // ============================================
  // MÉTODOS AUXILIARES (TU CÓDIGO EXISTENTE)
  // ============================================

  crearEventosBloqueados(horarios: any[], minInicio: number, maxFin: number): any[] {
    const bloqueados: any[] = [];
    const horariosPorDia: { [key: number]: any[] } = {};
    
    horarios.forEach(h => {
      if (!horariosPorDia[h.dia]) {
        horariosPorDia[h.dia] = [];
      }
      horariosPorDia[h.dia].push(h);
    });

    Object.keys(horariosPorDia).forEach(diaStr => {
      const dia = parseInt(diaStr);
      const horariosDelDia = horariosPorDia[dia].sort((a, b) => 
        this.toNumber(a.hora_inicio) - this.toNumber(b.hora_inicio)
      );

      const primerTurnoInicio = this.toNumber(horariosDelDia[0].hora_inicio);
      if (primerTurnoInicio > minInicio) {
        bloqueados.push({
          daysOfWeek: [dia],
          startTime: `${minInicio.toString().padStart(2, '0')}:00:00`,
          endTime: this.to24(horariosDelDia[0].hora_inicio),
          display: "background",
          color: "#E5E7EB",
          classNames: ['horario-bloqueado']
        });
      }

      for (let i = 0; i < horariosDelDia.length - 1; i++) {
        const finTurnoActual = this.toNumber(horariosDelDia[i].hora_fin);
        const inicioSiguienteTurno = this.toNumber(horariosDelDia[i + 1].hora_inicio);

        if (inicioSiguienteTurno > finTurnoActual) {
          bloqueados.push({
            daysOfWeek: [dia],
            startTime: this.to24(horariosDelDia[i].hora_fin),
            endTime: this.to24(horariosDelDia[i + 1].hora_inicio),
            display: "background",
            color: "#E5E7EB",
            classNames: ['horario-bloqueado']
          });
        }
      }

      const ultimoTurnoFin = this.toNumber(horariosDelDia[horariosDelDia.length - 1].hora_fin);
      if (ultimoTurnoFin < maxFin) {
        bloqueados.push({
          daysOfWeek: [dia],
          startTime: this.to24(horariosDelDia[horariosDelDia.length - 1].hora_fin),
          endTime: `${maxFin.toString().padStart(2, '0')}:00:00`,
          display: "background",
          color: "#E5E7EB",
          classNames: ['horario-bloqueado']
        });
      }
    });

    const diasConHorario = Object.keys(horariosPorDia).map(d => parseInt(d));
    const todosLosDias = [0, 1, 2, 3, 4, 5, 6];
    
    todosLosDias.forEach(dia => {
      if (!diasConHorario.includes(dia)) {
        bloqueados.push({
          daysOfWeek: [dia],
          startTime: `${minInicio.toString().padStart(2, '0')}:00:00`,
          endTime: `${maxFin.toString().padStart(2, '0')}:00:00`,
          display: "background",
          color: "#E5E7EB",
          classNames: ['horario-bloqueado']
        });
      }
    });

    return bloqueados;
  }

  toNumber(hora: string): number {
    const [raw, mer] = hora.trim().split(" ");
    let h = parseInt(raw.split(':')[0], 10);

    if (mer?.toUpperCase() === "PM" && h !== 12) {
      h += 12;
    }
    if (mer?.toUpperCase() === "AM" && h === 12) {
      h = 0;
    }

    return h;
  }

  to24(hora: string): string {
    const h = this.toNumber(hora);
    return `${h.toString().padStart(2, "0")}:00:00`;
  }

  onCellClick(info: any) {
    const infoDate: Date = info.date;
    const infoStr: string = info.dateStr;

    // Evitar citas pasadas
    const ahora = new Date();
    if (infoDate < ahora) {
      console.log("No se puede seleccionar horas pasadas");
      return;
    }

    // Verificar si la celda está bloqueada
    const eventos = this.calendarOptions.events.filter((e: any) => {
      if (!e.start) return false;
      
      const eventoInicio = new Date(e.start);
      const eventoFin = new Date(e.end);
      
      return (
        infoDate >= eventoInicio &&
        infoDate < eventoFin &&
        (e.classNames?.includes('cita-ocupada') || e.classNames?.includes('horario-bloqueado'))
      );
    });

    if (eventos.length > 0) {
      console.log("Horario ocupado, no se puede seleccionar");
      return;
    }

    // Celda disponible
    const fecha = infoStr.split('T')[0];
    /*const hora = infoDate.toLocaleTimeString('es-MX', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });*/

    const hora = infoDate.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });

    console.log("Crear cita en:", fecha, hora);
    // Guardar fecha y hora en signals
    this.fechaSeleccionada.set(fecha);
    this.horaSeleccionada.set(hora);

    // Abrir modal según rol
    if (this.rolUsuario === 'dentista') {
      this.modalCrearCita.set(true);
    } else {
      this.modalSolicCita.set(true);
    }

  }

  onCitaCreada(citaCreada: any) {
    console.log("Cita creada, actualizando calendario...", citaCreada);
    // Recargar todas las citas
    this.cargarTodasCitas();
  }

}