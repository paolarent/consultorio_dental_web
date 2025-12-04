import { AfterViewInit, Component, ElementRef, EventEmitter, inject, Input, OnInit, Output, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import flatpickr from 'flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es.js';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { CitaService } from '../../services/cita.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-modal-solic-cita',
  imports: [FormsModule, MatFormFieldModule, MatSelectModule, MatOptionModule, NgxMaterialTimepickerModule],
  templateUrl: './modal-solic-cita.html',
  styleUrl: './modal-solic-cita.css'
})
export class ModalSolicCita implements OnInit, AfterViewInit {
  @Output() cerrar = new EventEmitter<void>();
  @Output() Solicitar = new EventEmitter<any>();

  @Input() fechaInicial: string = '';
  @Input() horaInicial: string = '';

  private citaService = inject(CitaService);
  private notify = inject(NotificationService);

  id_motivo: number | null = null;
  fecha: string = '';
  notas: string = '';
  hora_inicio: string = '';

  tiposMotivo: { id_motivo: number; nombre: string; id_servicio: number | null }[] = [];

  cargando = signal(false);

  @ViewChild('fechaInput', { static: false }) fechaInput!: ElementRef<HTMLInputElement>;
  private fpInstance: any;

  ngOnInit() {
    this.fecha = this.fechaInicial || '';
    this.hora_inicio = this.horaInicial || '';
    this.cargarMotivos();
  }

  ngAfterViewInit() {
    this.initFlatpickr();
  }

  cargarMotivos() {
    this.citaService.listarMotivos().subscribe({
      next: (data) => this.tiposMotivo = data,
      error: (err: any) => console.error('Error cargando motivos:', err)
    });
  }

  // ------------------- Flatpickr -------------------
  private initFlatpickr() {
    if (!this.fechaInput) return;

    this.fpInstance = flatpickr([this.fechaInput.nativeElement], {
      dateFormat: 'Y-m-d',
      locale: Spanish,
      allowInput: true,
      defaultDate: this.fecha || undefined,
      minDate: new Date(),
      onChange: (selectedDates, dateStr) => {
        this.fecha = dateStr;
      }
    });

    this.fechaInput.nativeElement.addEventListener('input', (event: any) => {
      this.fecha = event.target.value;
    });
  }

  solicitarCita() {
    if (this.cargando()) return;

    if (!this.id_motivo) {
      this.notify.error('Debe seleccionar un motivo de consulta');
      return;
    }

    if (!this.fecha || !this.hora_inicio) {
      this.notify.error('Debes seleccionar fecha y hora');
      return;
    }

    const dto = {
      id_motivo: this.id_motivo,
      fecha: this.fecha,
      hora_inicio: this.hora_inicio,
      notas: this.notas,
    };

    this.cargando.set(true);

    this.citaService.solicitarCita(dto).subscribe({
      next: (res) => {
        this.notify.success(res.mensaje);
        this.Solicitar.emit(res.cita);
        this.cerrar.emit();
      },
      error: (err) => {
        console.error(err);
        this.notify.error(err.error?.message || 'Error al solicitar cita');
        this.cargando.set(false);
      },
      complete: () => this.cargando.set(false),
    });
  }

  cancelar(): void {
    this.cerrar.emit();
  }

}