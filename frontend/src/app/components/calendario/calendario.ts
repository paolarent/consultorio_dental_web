import { Component, OnInit, signal } from '@angular/core';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import esLocale from '@fullcalendar/core/locales/es';
import { HorarioService } from '../../services/horario.service';

@Component({
  selector: 'app-calendario',
  imports: [FullCalendarModule],
  templateUrl: './calendario.html',
  styleUrl: './calendario.css'
})
export class Calendario implements OnInit {

  constructor(private horarioService: HorarioService) {}

  calendarOptions: any = {
    locales: [esLocale],
    locale: 'es',
    initialView: 'timeGridWeek',
    plugins: [
      dayGridPlugin,
      timeGridPlugin,
      interactionPlugin
    ],
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
    height: 'auto', // Cambiará a valor específico en responsive
    contentHeight: 600, // Altura del contenido scrolleable (solo para tablet/desktop)
    nowIndicator: true,
    slotMinTime: '06:00:00',
    slotMaxTime: '22:00:00',
    selectConstraint: 'horario-disponible',
    selectOverlap: false,
    selectable: true,
    selectMirror: true,
    select: this.onCellClick.bind(this),
    events: []
  };

  ngOnInit() {
    this.cargarHorario();
  }

  cargarHorario() {
    this.horarioService.obtenerHorario().subscribe(horarios => {

      console.log("Horarios recibidos:", horarios);

      if (!horarios || horarios.length === 0) {
        console.warn("No hay horarios disponibles");
        return;
      }

      // ---------------------------
      // 1) Convertir horas a formato numérico
      // ---------------------------
      const horasInicio = horarios.map(h => this.toNumber(h.hora_inicio));
      const horasFin = horarios.map(h => this.toNumber(h.hora_fin));

      const minInicio = Math.min(...horasInicio);
      const maxFin = Math.max(...horasFin);

      console.log("Hora mínima:", minInicio);
      console.log("Hora máxima:", maxFin);

      // ---------------------------
      // 2) Crear eventos de DISPONIBILIDAD (horario disponible)
      // ---------------------------
      const eventosDisponibles = horarios.map(h => ({
        daysOfWeek: [h.dia],
        startTime: this.to24(h.hora_inicio),
        endTime: this.to24(h.hora_fin),
        display: "background",
        color: "#C3F2F3", // Tu color celeste
        classNames: ['horario-disponible']
      }));

      // ---------------------------
      // 3) Crear eventos de BLOQUEO (horario NO disponible)
      // ---------------------------
      const eventosBloqueados = this.crearEventosBloqueados(horarios, minInicio, maxFin);

      // ---------------------------
      // 4) Combinar todos los eventos
      // ---------------------------
      const todosLosEventos = [...eventosDisponibles, ...eventosBloqueados];

      // ---------------------------
      // 5) Calcular límites de tiempo
      // ---------------------------
      const slotMinTime = `${minInicio.toString().padStart(2, '0')}:00:00`;
      const slotMaxTime = `${maxFin.toString().padStart(2, '0')}:00:00`;

      console.log("slotMinTime:", slotMinTime);
      console.log("slotMaxTime:", slotMaxTime);

      // ---------------------------
      // 6) Actualizar las opciones del calendario
      // ---------------------------
      this.calendarOptions = {
        ...this.calendarOptions,
        slotMinTime: slotMinTime,
        slotMaxTime: slotMaxTime,
        events: todosLosEventos
      };

      console.log("Calendario actualizado con", eventosBloqueados.length, "bloques");
    });
  }

  // Crea eventos de bloqueo para los huecos entre turnos y fuera de horario
  crearEventosBloqueados(horarios: any[], minInicio: number, maxFin: number): any[] {
    const bloqueados: any[] = [];

    // Agrupar horarios por día
    const horariosPorDia: { [key: number]: any[] } = {};
    
    horarios.forEach(h => {
      if (!horariosPorDia[h.dia]) {
        horariosPorDia[h.dia] = [];
      }
      horariosPorDia[h.dia].push(h);
    });

    // Para cada día con horarios
    Object.keys(horariosPorDia).forEach(diaStr => {
      const dia = parseInt(diaStr);
      const horariosDelDia = horariosPorDia[dia].sort((a, b) => 
        this.toNumber(a.hora_inicio) - this.toNumber(b.hora_inicio)
      );

      // Bloquear desde el inicio del día hasta el primer turno
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

      // Bloquear los huecos entre turnos
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

      // Bloquear desde el último turno hasta el fin del día
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

    // Bloquear días que NO tienen horarios definidos
    const diasConHorario = Object.keys(horariosPorDia).map(d => parseInt(d));
    const todosLosDias = [0, 1, 2, 3, 4, 5, 6]; // Domingo a Sábado
    
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

  // Convierte "8:00 AM" → 8, "3:00 PM" → 15
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

  // Convierte a HH:mm:ss
  to24(hora: string): string {
    const h = this.toNumber(hora);
    return `${h.toString().padStart(2, "0")}:00:00`;
  }

  // Obtiene la próxima fecha para un día de la semana (0=Domingo, 1=Lunes, etc.)
  obtenerProximaFecha(diaSemana: number): string {
    const hoy = new Date();
    const diaActual = hoy.getDay();
    
    let diferencia = diaSemana - diaActual;
    if (diferencia < 0) diferencia += 7;
    
    const proximaFecha = new Date(hoy);
    proximaFecha.setDate(hoy.getDate() + diferencia);
    
    return proximaFecha.toISOString().split('T')[0];
  }

  onCellClick(info: any) {
    const fecha = info.startStr;   // 2025-11-28T10:00:00
    const hora = info.start.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

    console.log("Fecha seleccionada:", fecha);
    console.log("Hora:", hora);

    // Aquí abres tu modal/componente
    //this.abrirModalCrearCita(fecha, hora);
  }

}