import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, OnInit, AfterViewInit, inject } from '@angular/core';
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
import { NotificationService } from '../../services/notification.service';
import { TogglePasswordDirective } from '../../directives/toggle-password';
import { UsuarioService } from '../../services/usuario.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-modal-editar-paciente',
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatSelectModule, MatOptionModule, TogglePasswordDirective],
  templateUrl: './modal-editar-paciente.html',
  styleUrl: './modal-editar-paciente.css'
})
export class ModalEditarPaciente implements OnInit, AfterViewInit {
  private usuarioService = inject(UsuarioService);
  private notify = inject(NotificationService);
  auth = inject(AuthService);
  private pacienteService = inject(PacienteService);

  correoNuevo: string = '';

  contrasenaActual: string = '';
  contrasenaNueva: string = '';
  contrasenaConfirmar: string = '';

  @Input() paciente!: UpdatePaciente;
  @Output() actualizar = new EventEmitter<UpdatePaciente>();
  @Output() cerrar = new EventEmitter<void>();

  @ViewChild('fechaInput', { static: false }) fechaInput!: ElementRef<HTMLInputElement>;
  @ViewChild('pacienteStep1Form') pacienteStep1Form!: NgForm;
  @ViewChild('pacienteStep2Form') pacienteStep2Form!: NgForm;
  @ViewChild('pacienteStep3Form') pacienteStep3Form!: NgForm; 

  Sexo = Sexo;
  SiONo = SiONo;

  tieneTutor = false;
  step = 1;
  showPasswordFields = false;

  private fpInstance: any;
  // Propiedad para validar el botón 'Siguiente'
  isStep1Valid = false;

  ngOnInit() {
    this.tieneTutor = this.paciente.tiene_tutor === SiONo.SI;

    const usuarioActual = this.auth.usuario(); 
    this.correoNuevo = usuarioActual?.correo ?? '';
  }

  ngAfterViewInit() {
    if (this.step === 1) this.initFlatpickr();
    //this.initFlatpickr();
  }

  // Observa los cambios del formulario para habilitar el botón "Siguiente"
  ngDoCheck() {
    if (this.pacienteStep1Form) this.isStep1Valid = !!this.pacienteStep1Form.valid;
    //if (this.pacienteStep1Form) {
      //this.isStep1Valid = !!this.pacienteStep1Form.valid;
    //}
  }

  togglePasswordFields() {
    this.showPasswordFields = !this.showPasswordFields;
  }


  private initFlatpickr() {
    if (!this.fechaInput) return;

    let fechaParaFlatpickr = this.paciente.fecha_nacimiento;
    if (fechaParaFlatpickr && fechaParaFlatpickr.includes('T')) {
      fechaParaFlatpickr = fechaParaFlatpickr.split('T')[0];
    }

    this.fpInstance = flatpickr(this.fechaInput.nativeElement, {
      dateFormat: 'Y-m-d',
      locale: Spanish,
      defaultDate: fechaParaFlatpickr,
      allowInput: true, // permite que el usuario borre manualmente
      onChange: (selectedDates, dateStr) => this.validateFecha(dateStr),
    });

    // Detecta si el usuario borra manualmente la fecha
    this.fechaInput.nativeElement.addEventListener('input', (event: any) => {
      this.validateFecha(event.target.value);
    });
  }

  private validateFecha(value: string) {
    this.paciente.fecha_nacimiento = value;

    if (this.pacienteStep1Form?.controls?.['fechaNacimiento']) {
      const control = this.pacienteStep1Form.controls['fechaNacimiento'];
      if (!value) {
        control.setErrors({ required: true }); // marca como inválido si está vacío
      } else {
        control.setErrors(null); // marca como válido si tiene valor
      }
      control.markAsDirty();
      control.updateValueAndValidity();
    }
  }


  toggleTutor() {
    this.tieneTutor = !this.tieneTutor;
    if (!this.tieneTutor) {
      // Limpiar los campos del tutor para enviarle null al backend
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

  // --- Navegación entre steps ---
  siguienteStep() {
    if (this.step === 1 && this.pacienteStep1Form.invalid) {
      this.notify.warning('Debe completar los campos obligatorios');
      return;
    }

    if (this.step === 2 && this.pacienteStep2Form.invalid) {
      this.notify.warning('Debe completar los campos obligatorios');
      return;
    }

    if (this.step === 1) {
      this.step = 2;
      if (this.fpInstance) {
        this.fpInstance.destroy();
        this.fpInstance = null;
      }
    } else if (this.step === 2) {
      this.step = 3; // Avanza al nuevo step 3
    }
  }

  volverStep() {
    if (this.step === 2) {
      this.step = 1;
      setTimeout(() => this.initFlatpickr(), 0);
    } else if (this.step === 3) {
      this.step = 2;
    }
  }

  guardarCambios() {
    if (this.step === 3 && this.pacienteStep3Form?.invalid) {
      this.notify.warning('Debe completar los campos obligatorios');
      return;
    }

    const usuarioActual = this.auth.usuario();
    const idUsuario = usuarioActual?.id_usuario;
    const correoOriginal = usuarioActual?.correo?.trim();
    const correoNuevo = this.correoNuevo.trim();

    // 1️⃣ Cambio de correo
    if (correoNuevo && correoNuevo !== correoOriginal) {
      if (!idUsuario) {
        this.notify.error('No se encontró el ID del usuario');
        return;
      }

      this.usuarioService.correoUpdateRequest(idUsuario, correoNuevo).subscribe({
        next: () => {
          this.notify.success('Se envió un correo de verificación al nuevo correo.');
          this.auth.getMe().subscribe(); // 🔄 actualiza datos del usuario en memoria
        },
        error: (err) => {
          console.error('Error al solicitar cambio de correo', err);
          this.notify.error('Error al solicitar cambio de correo.');
        }
      });
    }

    // 2️⃣ Cambio de contraseña
    if (this.showPasswordFields && this.contrasenaNueva.trim()) {
      if (this.contrasenaNueva !== this.contrasenaConfirmar) {
        this.notify.warning('Las contraseñas no coinciden.');
        return;
      }

      if (!idUsuario) {
        this.notify.error('No se encontró el ID del usuario');
        return;
      }

      this.usuarioService.updateContrasena(
        idUsuario,
        this.contrasenaActual,
        this.contrasenaNueva,
        this.contrasenaConfirmar
      ).subscribe({
        next: () => this.notify.success('Contraseña actualizada correctamente.'),
        error: (err) => {
          console.error('Error al actualizar contraseña', err);
          this.notify.error('Error al actualizar la contraseña.');
        }
      });
    }

    // 3️⃣ Actualizamos los datos del paciente
    const datosActualizados = { ...this.paciente, id_paciente: this.paciente.id_paciente };
    this.actualizar.emit(datosActualizados);
  }

  onCorreoEditado() {
    const idUsuario = this.auth.usuario()?.id_usuario
    const correo = this.auth.usuario()?.correo.trim();

    if (!correo || !idUsuario) return;

    this.usuarioService.correoUpdateRequest(idUsuario, correo).subscribe({
      next: () => {
        this.notify.success('Correo actualizado correctamente.');
      },
      error: (err) => {
        console.error('Error al actualizar correo', err);
        this.notify.error('Error al actualizar el correo.');
      },
    });
  }


  cancelar() {
    this.cerrar.emit();
  }
}
