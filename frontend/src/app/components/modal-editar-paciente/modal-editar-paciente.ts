import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { Sexo, SiONo } from '../../../../../backend/src/common/enums';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UpdatePaciente } from '../../models/update-paciente.model';
import flatpickr from 'flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es.js';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';

@Component({
  selector: 'app-modal-editar-paciente',
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatSelectModule, MatOptionModule,],
  templateUrl: './modal-editar-paciente.html',
  styleUrl: './modal-editar-paciente.css'
})
export class ModalEditarPaciente {
  @Input() paciente!: UpdatePaciente;
  @Output() actualizar = new EventEmitter<UpdatePaciente>();
  @Output() cerrar = new EventEmitter<void>();

  @ViewChild('fechaInput', { static: false }) fechaInput!: ElementRef<HTMLInputElement>;

  // Enums expuestos al template
  Sexo = Sexo;
  SiONo = SiONo;
  
  tieneTutor: boolean = false;
  step: number = 1; // <-- control del wizard (1 = datos personales, 2 = dirección)

  ngOnInit() {
    this.tieneTutor = this.paciente.tiene_tutor === SiONo.SI;
  }

  ngAfterViewInit() {
    flatpickr(this.fechaInput.nativeElement, {
      dateFormat: 'd-m-Y',
      locale: Spanish, 
      defaultDate: this.paciente.fecha_nacimiento || undefined, //para que se muestre la fecha actual del paciente
      onChange: (selectedDates) => {
        const fecha = selectedDates[0]?.toISOString().split('T')[0];
        if (fecha) this.paciente.fecha_nacimiento = fecha;
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
  
  // Método seguro para inputs y selects
  actualizarCampo(event: Event, campo: keyof UpdatePaciente) {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    (this.paciente as any)[campo] = target.value;
  }

  siguienteStep() {
    this.step = 2;
  }

  volverStep() {
    this.step = 1;
  }

  guardarCambios() {
    this.paciente.tiene_tutor = this.tieneTutor ? SiONo.SI : SiONo.NO;
    this.actualizar.emit(this.paciente);
  }

  cancelar() {
    this.cerrar.emit();
  }
}