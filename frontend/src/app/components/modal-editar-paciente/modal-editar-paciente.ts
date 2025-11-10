import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import { Sexo, SiONo } from '../../../../../backend/src/common/enums';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
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
  @ViewChild('pacienteStep1Form') pacienteStep1Form!: NgForm;
  @ViewChild('pacienteStep2Form') pacienteStep2Form!: NgForm;

  Sexo = Sexo;
  SiONo = SiONo;

  tieneTutor = false;
  step = 1;

  private fpInstance: any;
  // Propiedad para validar el botón 'Siguiente'
  isStep1Valid = false;

  constructor(private pacienteService: PacienteService) {}

  ngOnInit() {
    this.tieneTutor = this.paciente.tiene_tutor === SiONo.SI;
  }

  ngAfterViewInit() {
    this.initFlatpickr();
  }

  // Observa los cambios del formulario para habilitar el botón "Siguiente"
  ngDoCheck() {
    if (this.pacienteStep1Form) {
      this.isStep1Valid = !!this.pacienteStep1Form.valid;
    }
  }

  private initFlatpickr() {
    if (!this.fechaInput) return;

    let fechaParaFlatpickr = this.paciente.fecha_nacimiento;
  
     // Detectamos si la fecha viene con información de hora y zona horaria
     // y si es así, extraemos SOLAMENTE la parte YYYY-MM-DD.
      if (fechaParaFlatpickr && fechaParaFlatpickr.includes('T')) {
        fechaParaFlatpickr = fechaParaFlatpickr.split('T')[0];
      }

      // Inicializamos flatpickr
      this.fpInstance = flatpickr(this.fechaInput.nativeElement, {
      dateFormat: 'Y-m-d',
      locale: Spanish,
       // Usamos la fecha limpia 'YYYY-MM-DD'
        defaultDate: fechaParaFlatpickr, 
        onChange: (selectedDates, dateStr) => {
        if (selectedDates.length > 0) {
          // Guarda directamente en el modelo
          this.paciente.fecha_nacimiento = dateStr;

          // Si quieres que Angular detecte el cambio en el template:
          if (this.pacienteStep1Form?.controls?.['fechaNacimiento']) {
            this.pacienteStep1Form.controls['fechaNacimiento'].markAsDirty();
            this.pacienteStep1Form.controls['fechaNacimiento'].updateValueAndValidity();
          }
        }
      },
    });
  }

  toggleTutor() {
    this.tieneTutor = !this.tieneTutor;
    if (!this.tieneTutor) {
      // Limpiar los campos del tutor para enviarle null/vacío al backend
      this.paciente.tutor_nombre = null;
      this.paciente.tutor_apellido1 = null;
      this.paciente.tutor_apellido2 = null;
      this.paciente.tutor_telefono = null;
      this.paciente.tutor_correo = null;
      this.paciente.tutor_relacion = null;
    }

    // Forzar revalidación si cambiamos el estado del tutor
    if (this.pacienteStep1Form) {
      this.pacienteStep1Form.form.updateValueAndValidity();

    }
  }

  actualizarCampo(eventoOValor: any, campo: keyof UpdatePaciente) {
    let valorFinal = eventoOValor;

    // Si el 'eventoOValor' parece ser un evento de input HTML (tiene target y target.value)
    if (eventoOValor && eventoOValor.target && eventoOValor.target.value !== undefined) {
      valorFinal = eventoOValor.target.value;
    } 
    // Si viene de MatSelect, ya viene el valor, no se toca.

    (this.paciente as any)[campo] = valorFinal;
    //(this.paciente as any)[campo] = valor;
  }

  siguienteStep() {
    if (this.pacienteStep1Form.invalid) {
      // Mostrar un mensaje de error al usuario, maybe con los toast
      return;
    }

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

    const datosActualizados = {
      ...this.paciente, // ya contiene todos los valores actualizados
      id_paciente: this.paciente.id_paciente
    };

    this.actualizar.emit(datosActualizados);
  }

  cancelar() {
    this.cerrar.emit();
  }
}
