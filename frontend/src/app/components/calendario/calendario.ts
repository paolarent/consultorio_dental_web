import { Component } from '@angular/core';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import esLocale from '@fullcalendar/core/locales/es';


@Component({
  selector: 'app-calendario',
  imports: [FullCalendarModule],
  templateUrl: './calendario.html',
  styleUrl: './calendario.css'
})
export class Calendario {
  calendarOptions = {
    locales: [esLocale],
    locale: 'es',  // idioma español
    initialView: 'dayGridMonth',
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
    height: 'auto',
    contentHeight: 'auto',
    handleWindowResize: true,
    expandRows: true,
    selectable: true,
    events: [
      { title: 'Consulta General', date: '2025-01-05' },
      { title: 'Limpieza Dental', date: '2025-01-12' },
    ],
  };

}
