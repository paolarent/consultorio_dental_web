import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import { Sexo, SiONo } from '../../../../../backend/src/common/enums';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UpdatePaciente } from '../../models/update-paciente.model';
import { PacienteService } from '../../services/paciente.service';
import flatpickr from 'flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es.js';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';

@Component({
  selector: 'app-modal-editar-paciente',
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatSelectModule, MatOptionModule],
  templateUrl: './modal-editar-paciente.html',
  styleUrl: './modal-editar-paciente.css'
})
export class ModalEditarPaciente implements OnInit, AfterViewInit {
  @Input() paciente!: UpdatePaciente;
  @Output() actualizar = new EventEmitter<UpdatePaciente>();
  @Output() cerrar = new EventEmitter<void>();

  @ViewChild('fechaInput', { static: false }) fechaInput!: ElementRef<HTMLInputElement>;

  Sexo = Sexo;
  SiONo = SiONo;

  tieneTutor = false;
  step = 1;

  private fpInstance: any;

  constructor(private pacienteService: PacienteService) {}

  ngOnInit() {
    this.tieneTutor = this.paciente.tiene_tutor === SiONo.SI;
  }

  ngAfterViewInit() {
    this.initFlatpickr();
  }

  private initFlatpickr() {
    if (!this.fechaInput) return;

      // --- 1. Arreglo Defensivo para Fechas con T/Z (UTC) ---
    let fechaParaFlatpickr = this.paciente.fecha_nacimiento;
  
     // Detectamos si la fecha viene con información de hora y zona horaria (T...Z)
     // y si es así, extraemos SOLAMENTE la parte YYYY-MM-DD.
      if (fechaParaFlatpickr && fechaParaFlatpickr.includes('T')) {
        fechaParaFlatpickr = fechaParaFlatpickr.split('T')[0];
      }
      // ----------------------------------------------------

      // Inicializamos flatpickr
      this.fpInstance = flatpickr(this.fechaInput.nativeElement, {
      dateFormat: 'Y-m-d',
      locale: Spanish,
       // Usamos la fecha limpia 'YYYY-MM-DD'
       defaultDate: fechaParaFlatpickr, // <-- Usamos la fecha corregida
        onChange: (selectedDates, dateStr) => {
        if (selectedDates.length > 0) {
         // Al seleccionar, flatpickr nos da el string 'YYYY-MM-DD', lo guardamos tal cual
          this.paciente.fecha_nacimiento = dateStr;
        }
      },
    });
  }

  toggleTutor() {
    this.tieneTutor = !this.tieneTutor;
    if (!this.tieneTutor) {
      this.paciente.tutor_nombre = '';
      this.paciente.tutor_apellido1 = '';
      this.paciente.tutor_apellido2 = '';
      this.paciente.tutor_telefono = '';
      this.paciente.tutor_correo = '';
      this.paciente.tutor_relacion = '';
    }
  }

  actualizarCampo(valor: any, campo: keyof UpdatePaciente) {
    (this.paciente as any)[campo] = valor;
  }

  siguienteStep() {
    this.step = 2;
    if (this.fpInstance) {
      this.fpInstance.destroy();
      this.fpInstance = null;
    }
  }

  volverStep() {
    this.step = 1;
    setTimeout(() => this.initFlatpickr(), 0); // re-iniciamos flatpickr al volver
  }

  guardarCambios() {
    this.paciente.tiene_tutor = this.tieneTutor ? SiONo.SI : SiONo.NO;
    this.actualizar.emit(this.paciente);
  }

  cancelar() {
    this.cerrar.emit();
  }
}
