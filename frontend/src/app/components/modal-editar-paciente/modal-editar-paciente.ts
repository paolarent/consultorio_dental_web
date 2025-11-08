import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Sexo, SiONo } from '../../../../../backend/src/common/enums';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UpdatePaciente } from '../../models/update-paciente.model';

@Component({
  selector: 'app-modal-editar-paciente',
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-editar-paciente.html',
  styleUrl: './modal-editar-paciente.css'
})
export class ModalEditarPaciente {
  @Input() paciente!: UpdatePaciente;
  @Output() actualizar = new EventEmitter<UpdatePaciente>();
  @Output() cerrar = new EventEmitter<void>();

  // Enums expuestos al template
  Sexo = Sexo;
  SiONo = SiONo;
  
  tieneTutor: boolean = false;

  ngOnInit() {
    this.tieneTutor = this.paciente.tiene_tutor === SiONo.SI;
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

  
  actualizarinput(campo: keyof UpdatePaciente, valor: any) {
    (this.paciente as any)[campo] = valor;
  }
  

  // Método seguro para inputs y selects
  actualizarCampo(event: Event, campo: keyof UpdatePaciente) {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    (this.paciente as any)[campo] = target.value;
  }


  guardarCambios() {
    this.paciente.tiene_tutor = this.tieneTutor ? SiONo.SI : SiONo.NO;
    this.actualizar.emit(this.paciente);
  }

  cancelar() {
    this.cerrar.emit();
  }
}