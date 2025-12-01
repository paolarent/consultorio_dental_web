import { DatePipe } from '@angular/common';
import { Component, ElementRef, EventEmitter, inject, Input, Output, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import flatpickr from 'flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es.js';
import { NgxMaterialTimepickerComponent, NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { ModalAvisoReprog } from '../modal-aviso-reprog/modal-aviso-reprog';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-modal-reprog-cita',
  imports: [FormsModule, NgxMaterialTimepickerModule, DatePipe, ModalAvisoReprog],
  templateUrl: './modal-reprog-cita.html',
  styleUrl: './modal-reprog-cita.css'
})
export class ModalReprogCita {
  private notify = inject(NotificationService);

  @Output() cerrar = new EventEmitter<void>();
  @Output() reprogramar = new EventEmitter<any>();
  @Input() cita: any;

  @Input() mostrarPaciente = true;
  @Input() mostrarServicio = true;

  cargando = signal(false);

  @ViewChild('fechaInput', { static: false }) fechaInput!: ElementRef<HTMLInputElement>;

  fecha_nueva: string = '';
  hora_nueva: string = '';
  fecha_actual: string = '';
  hora_actual: string = '';

  mostrarConfirmacion = signal(false);
  mostrarModalPrincipal = signal(true);

  private fpInstance: any;

  ngOnInit() {
    if (this.cita) {
      this.fecha_actual = this.cita.fecha;       // cargar fecha actual
      this.hora_actual = this.cita.hora_inicio; // cargar hora actual
    }
  }
  
  ngAfterViewInit() {
    this.initFlatpickr();
  }

  // ------------------- Flatpickr -------------------
  private initFlatpickr() {
    if (!this.fechaInput) return;

    this.fpInstance = flatpickr([this.fechaInput.nativeElement], {
      dateFormat: 'Y-m-d',
      locale: Spanish,
      allowInput: true,
      defaultDate: this.fecha_nueva || undefined,
      minDate: new Date(),
      onChange: (selectedDates, dateStr) => {
        this.fecha_nueva = dateStr;
      }
    });

    this.fechaInput.nativeElement.addEventListener('input', (event: any) => {
      this.fecha_nueva = event.target.value;
    });
  }

  cancelar(): void {
    this.cerrar.emit();
  }

  continuar(): void {
    if (!this.fecha_nueva || !this.hora_nueva) {
      this.notify.warning('Por favor selecciona fecha y hora nuevas antes de continuar.');
      return; // No abrimos el modal
  }
    // Abrimos el modal de confirmación y cerramos el principal (este)
    this.mostrarModalPrincipal.set(false);
    this.mostrarConfirmacion.set(true);
  }

  onConfirmar(datos: { fecha: string; hora: string }) {
    this.reprogramar.emit(datos);
    this.mostrarConfirmacion.set(false); // cerramos el modal de confirmación
  }

  onCancelarConfirmacion() {
    this.initFlatpickr();
    this.mostrarConfirmacion.set(false);
    this.mostrarModalPrincipal.set(true); // volvemos a mostrar el modal principal
  }

}
