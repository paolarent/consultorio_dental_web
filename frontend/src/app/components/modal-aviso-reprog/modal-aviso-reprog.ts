import { DatePipe, registerLocaleData } from '@angular/common';
import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import localeEs from '@angular/common/locales/es';

registerLocaleData(localeEs, 'es');

@Component({
  selector: 'app-modal-aviso-reprog',
  imports: [DatePipe],
  templateUrl: './modal-aviso-reprog.html',
  styleUrl: './modal-aviso-reprog.css'
})
export class ModalAvisoReprog {
  // Datos de la cita original
  @Input() paciente!: string;
  @Input() servicio!: string;
  @Input() fecha_actual!: string;
  @Input() hora_actual!: string;

  // Datos nuevos (como string, recibidos del padre)
  @Input() fecha_nueva!: string;
  @Input() hora_nueva!: string;

  // Eventos
  @Output() cancelar = new EventEmitter<void>();
  @Output() confirmar = new EventEmitter<{fecha: string, hora: string}>();

  confirmarClick() {
    this.confirmar.emit({
      fecha: this.fecha_nueva,
      hora: this.hora_nueva
    });
  }
}
