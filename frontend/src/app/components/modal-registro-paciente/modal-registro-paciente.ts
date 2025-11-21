import { Component, ElementRef, EventEmitter, inject, Input, Output, ViewChild } from '@angular/core';
import { UsuarioService } from '../../services/usuario.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../auth/auth.service';
import { PacienteService } from '../../services/paciente.service';
import { UpdatePaciente } from '../../models/update-paciente.model';
import { FormsModule, NgForm } from '@angular/forms';
import { Sexo, SiONo } from '../../../../../backend/src/common/enums';
import { catchError, forkJoin, of, tap } from 'rxjs';
import flatpickr from 'flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es.js';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-registro-paciente',
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatSelectModule, MatOptionModule],
  templateUrl: './modal-registro-paciente.html',
  styleUrl: './modal-registro-paciente.css'
})
export class ModalRegistroPaciente {
  @Input() correoInicial: string = '';
  @Output() cerrar = new EventEmitter<void>();
  @Output() registrar = new EventEmitter<any>();

  step = 1;

  // STEP 1
  correo = '';
  nombre = '';
  apellido1 = '';
  apellido2 = '';
  telefono = '';
  fechaNacimiento = '';
  sexo: Sexo = Sexo.MASCULINO;

  tieneTutor = false;

  tutor = {
    nombre: '',
    apellido1: '',
    apellido2: '',
    telefono: '',
    correo: '',
    relacion: '',
  };

  // STEP 2 – dirección
  direccion = {
    calle: '',
    num_exterior: '',
    colonia: '',
    cp: '',
    entidadfed: '',
    municipio: '',
    localidad: '',
  };

  Sexo = Sexo;

  ngOnInit() {
    this.correo = this.correoInicial || '';
  }

  // ---------- STEP FLOW ----------
  siguienteStep() {
    if (!this.step) return;
    this.step = 2;
  }

  volverStep() {
    this.step = 1;
  }

  cancelar() {
    this.cerrar.emit();
  }

  toggleTutor() {
    this.tieneTutor = !this.tieneTutor;

    if (!this.tieneTutor) {
      // Limpiar tutor
      this.tutor = {
        nombre: '',
        apellido1: '',
        apellido2: '',
        telefono: '',
        correo: '',
        relacion: '',
      };
    }
  }

  // ---------- REGISTRO FINAL ----------
  guardar() {
    const payload = {
      nombre: this.nombre.trim(),
      apellido1: this.apellido1.trim(),
      apellido2: this.apellido2.trim(),
      telefono: this.telefono.trim(),
      correo: this.correo.trim(),
      fechaNacimiento: this.fechaNacimiento,
      sexo: this.sexo,

      tieneTutor: this.tieneTutor,
      tutor: this.tieneTutor ? this.tutor : null,

      direccion: this.direccion,
    };

    this.registrar.emit(payload);
  }
}

