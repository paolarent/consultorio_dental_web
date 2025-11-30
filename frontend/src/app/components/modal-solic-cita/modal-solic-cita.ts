import { AfterViewInit, Component, ElementRef, EventEmitter, inject, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import flatpickr from 'flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es.js';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { CitaService } from '../../services/cita.service';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';

@Component({
  selector: 'app-modal-solic-cita',
  imports: [FormsModule, MatFormFieldModule, MatSelectModule, MatOptionModule, NgxMaterialTimepickerModule],
  templateUrl: './modal-solic-cita.html',
  styleUrl: './modal-solic-cita.css'
})
export class ModalSolicCita implements OnInit, AfterViewInit {
  @Output() cerrar = new EventEmitter<void>();
  @Output() Solcitar = new EventEmitter<any>();

  @Input() fechaInicial: string = '';
  @Input() horaInicial: string = '';

  private citaService = inject(CitaService);

  id_motivo: number | null = null;
  fecha: string = '';
  notas: string = '';
  hora_inicio: string = '';

  tiposMotivo: { id_motivo: number; nombre: string; id_servicio: number | null }[] = [];

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

  cancelar(): void {
    this.cerrar.emit();
  }

}