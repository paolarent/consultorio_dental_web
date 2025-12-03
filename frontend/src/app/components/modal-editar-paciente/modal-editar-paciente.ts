import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, OnInit, AfterViewInit, inject } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Sexo, SiONo } from '../../../../../backend/src/common/enums';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Paciente, UpdatePaciente } from '../../models/paciente.model';
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
  loading = false;
  contrasenaActual: string = '';
  contrasenaNueva: string = '';
  contrasenaConfirmar: string = '';

  @Input() paciente!: Paciente;

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
    const p = this.paciente;
    this.tieneTutor = p?.tiene_tutor === SiONo.SI; 
    //this.tieneTutor = this.paciente.tiene_tutor === SiONo.SI;

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
  }

  togglePasswordFields() {
    this.showPasswordFields = !this.showPasswordFields;
    //limpiar los inputs por estetica
    this.contrasenaActual = '';
    this.contrasenaNueva = '';
    this.contrasenaConfirmar = '';
  }


  private initFlatpickr() {
    if (!this.fechaInput) return;

    let fechaParaFlatpickr = this.paciente.fecha_nacimiento;
    if (fechaParaFlatpickr && fechaParaFlatpickr.includes('T')) {
      fechaParaFlatpickr = fechaParaFlatpickr.split('T')[0];
    }

    this.fpInstance = flatpickr(this.fechaInput.nativeElement, {
      dateFormat: 'Y-m-d',
      maxDate: "today",
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
    this.paciente.tiene_tutor = this.tieneTutor ? SiONo.SI : SiONo.NO;
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
    // bloquear si ya se está guardando
    if (this.loading) return;
    this.loading = true;

    if (this.step === 3 && this.pacienteStep3Form?.invalid) {
      this.notify.warning('Debe completar los campos obligatorios');
      return;
    }

    const usuarioActual = this.auth.usuario();
    const idUsuario = usuarioActual?.id_usuario;
    const observables = [];

    // Cambio de correo
    if (this.correoNuevo.trim() && this.correoNuevo.trim() !== usuarioActual?.correo) {
      observables.push(
        this.usuarioService.correoUpdateRequest(idUsuario!, this.correoNuevo).pipe(
          tap(() => this.notify.success('Se envió un correo de verificación al nuevo correo.')),
          catchError(err => {
            this.notify.error('Error al solicitar cambio de correo.');
            return of(null); // evita que forkJoin se rompa
          })
        )
      );
    }

    // Cambio de contraseña
    if (this.showPasswordFields && this.contrasenaNueva.trim()) {

      // Validación frontend (ya esta validado en el back tmb)
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,20}$/.test(this.contrasenaNueva)) {
        this.notify.warning('La nueva contraseña debe tener entre 8 y 20 caracteres, incluir mayúscula, minúscula, número y símbolo especial.');
        this.loading = false;
        return;
      }

      if (this.contrasenaNueva !== this.contrasenaConfirmar) {
        this.notify.warning('Las contraseñas no coinciden.');
        this.loading = false;
        return;
      }

      observables.push(
        this.usuarioService.updateContrasena(
          this.contrasenaActual,
          this.contrasenaNueva,
          this.contrasenaConfirmar
        ).pipe(
          tap(() => this.notify.success('Contraseña actualizada correctamente.')),
          catchError(err => {
            if (err.status === 400) {
              const mensaje = err?.error?.message?.[0] || err?.error?.message || 'Contraseña no válida';
              this.notify.error(mensaje);
            } else if (err.status === 401) {
              this.notify.error('No se pudo actualizar, la contraseña actual es incorrecta.');
            } else {
              this.notify.error('Error al actualizar la contraseña.');
            }
            return of(null);
          })
        )
      );
    }

     // **Si no hay observables, igual emitimos el cambio de datos**
    if (observables.length === 0) {
      this.actualizar.emit({ ...this.paciente });
      this.loading = false;
      return;
    }

    // Ejecuta todos los cambios y solo si hay éxito, emite al componente padre
    forkJoin(observables).subscribe(results => {
      const hayErrores = results.some(r => r === null);
      if (!hayErrores) {
        this.actualizar.emit({ ...this.paciente });
      }
    });
  }

  cancelar() {
    this.cerrar.emit();
  }
}
