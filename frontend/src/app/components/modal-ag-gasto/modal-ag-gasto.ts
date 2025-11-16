import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, inject, OnInit, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { EgresoService } from '../../services/gasto-egreso.service';
import flatpickr from 'flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es.js';
import { CreateEgresoDto } from '../../models/egreso.model';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-modal-ag-gasto',
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatSelectModule, MatOptionModule,],
  templateUrl: './modal-ag-gasto.html',
  styleUrl: './modal-ag-gasto.css'
})
export class ModalAgGasto implements OnInit, AfterViewInit {
  private notify = inject(NotificationService);
  @Output() cerrar = new EventEmitter<void>();
  @Output() agregadoExitoso = new EventEmitter<any>();

  @ViewChild('fechaInput', { static: false }) fechaInput!: ElementRef<HTMLInputElement>;

  monto: string = '';
  id_tipo_egreso!: number;
  fecha: string = '';
  descripcion: string = '';

  tiposGasto: {id_tipo_egreso: number; nombre: string} [] = [];
  errorMsg: string = '';

  constructor(private egresoService: EgresoService) {}

  ngOnInit(): void {
  this.egresoService.listarTiposEgreso().subscribe({
    next: (tipos) => {
      // seguridad: forzar a array
      this.tiposGasto = Array.isArray(tipos) ? tipos : [];
    },
    error: (err) => {
      console.error('Error al cargar tipos de gasto', err);
      this.tiposGasto = [];
    }
  });
}


  ngAfterViewInit(): void {
    if (!this.fechaInput) return;

    flatpickr(this.fechaInput.nativeElement, {
      dateFormat: 'Y-m-d',
      locale: Spanish,
      defaultDate: this.fecha || undefined,
      maxDate: new Date(),
      allowInput: true,
      onChange: (selectedDates, dateStr) => (this.fecha = dateStr)
    });
  }

  cancelar(): void {
    this.cerrar.emit();
  }

  guardar(): void {
    this.errorMsg = '';

    // Validaciones
    if (!this.monto || !this.id_tipo_egreso || !this.fecha || !this.descripcion) {
      this.notify.warning('Por favor, completa todos los campos');
      return;
    }

    // Validar monto como número decimal positivo
    const montoNum = parseFloat(this.monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      this.notify.error('El monto debe ser un número válido mayor que 0.');
      return;
    }

    // Validar fecha no futura
    if (new Date(this.fecha) > new Date()) {
      this.notify.error('La fecha no puede ser futura.');
      return;
    }

    const dto: CreateEgresoDto = {
      monto: parseFloat(Number(this.monto).toFixed(2)), // mantener como string con dos decimales
      id_tipo_egreso: this.id_tipo_egreso,
      fecha: this.fecha,
      descripcion: this.descripcion
    };

    // Enviar al backend
    this.egresoService.crearEgreso(dto).subscribe({
      next: (res) => {
        this.notify.success('Gasto registrado correctamente.');
        this.agregadoExitoso.emit(res);
        this.cancelar(); // cerrar modal al guardar
      },
      error: (err) => {
        console.error(err);
        this.notify.error('Error al registrar el gasto.');

      }
    });
  }
}