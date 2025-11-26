import { AfterViewInit, Component, ElementRef, EventEmitter, inject, Input, OnInit, Output, ViewChild } from '@angular/core';
import { NotificationService } from '../../services/notification.service';
import { FormsModule, NgForm } from '@angular/forms';
import { Sexo, SiONo } from '../../../../../backend/src/common/enums';
import flatpickr from 'flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es.js';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { CommonModule } from '@angular/common';
import { RegistroService } from '../../services/registro.service';

@Component({
  selector: 'app-modal-registro-paciente',
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatSelectModule, MatOptionModule],
  templateUrl: './modal-registro-paciente.html',
  styleUrl: './modal-registro-paciente.css'
})
export class ModalRegistroPaciente implements OnInit, AfterViewInit {
  private registroService = inject(RegistroService);
  private notify = inject(NotificationService);

  @Output() cerrar = new EventEmitter<void>();
  @Output() registrar = new EventEmitter<any>();  //para pasarle el resultado al padre

  @ViewChild('fechaInput', { static: false }) fechaInput!: ElementRef<HTMLInputElement>;
  @ViewChild('step1Form', { static: false }) step1Form!: NgForm;
  @ViewChild('step2Form', { static: false }) step2Form!: NgForm;

  private fpInstance: any;

  step = 1;
  loading = false;

  // STEP 1 - pagina 1 - datos basicos
  correo = '';
  nombre = '';
  apellido1 = '';
  apellido2 = '';
  telefono = '';
  fechaNacimiento = ''; // yyyy-mm-dd
  sexo: Sexo | null = null;
;

  tieneTutor = false;
  tutor = {
    nombre: '',
    apellido1: '',
    apellido2: '',
    telefono: '',
    correo: '',
    relacion: '',
  };

  // STEP 2 – pagina 2 - dirección
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
  SiONo = SiONo;

  ngOnInit() {
    this.correo = '';
  }

  ngAfterViewInit() {
    // inicia flatpickr kk cuando el input ya está disponible
    if (this.step === 1) this.initFlatpickr();
  }

  private initFlatpickr() {
    if (!this.fechaInput) return;

    const fechaDefault: any = this.fechaNacimiento || undefined;

    this.fpInstance = flatpickr(
      this.fechaInput.nativeElement as unknown as HTMLElement,
      {
        dateFormat: 'Y-m-d',
        maxDate: "today",
        locale: Spanish,
        defaultDate: fechaDefault,
        allowInput: true,
        onChange: (selectedDates, dateStr) => {
          this.fechaNacimiento = dateStr;
        }
      }
    );

    // Detectar si el usuario borra manualmente
    this.fechaInput.nativeElement.addEventListener('input', (event: any) => {
      this.fechaNacimiento = event.target.value;
    });

  }

  // ---------- NAVEGACION ENTRE PAGINAS ----------
  siguienteStep() {
    if (!this.nombre?.trim() || !this.apellido1?.trim() || !this.telefono?.trim() || !this.correo?.trim() || !this.fechaNacimiento?.trim() || !this.sexo?.trim() ) {
        this.notify.warning('Complete los campos obligatorios');
        return;
      }
    this.step = 2;
  }

  volverStep() {
    if (this.step === 2) {
      this.step = 1;
      setTimeout(() => this.initFlatpickr(), 0);
    }
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

  // ---------- REGISTRO Y EMICION ----------
  guardar() {
    // bloquear si ya se está guardando
    if (this.loading) return;

    // validaciones finales
    if (this.step === 2) {
      if (this.step2Form && this.step2Form.invalid) {
        this.notify.warning('Completa los campos obligatorios de la parte de registro 2.');
        return;
      }
    }

    const payload: any = {
      // paciente
      nombre: this.nombre.trim(),
      apellido1: this.apellido1.trim(),
      apellido2: this.apellido2?.trim() || null,
      telefono: this.telefono?.trim() || null,
      correo: this.correo.trim(),
      fecha_nacimiento: this.fechaNacimiento || null,
      sexo: this.sexo,

      // tutor
      tiene_tutor: this.tieneTutor ? SiONo.SI : SiONo.NO,
      tutor_nombre: this.tieneTutor ? this.tutor.nombre.trim() || null : null,
      tutor_apellido1: this.tieneTutor ? this.tutor.apellido1.trim() || null : null,
      tutor_apellido2: this.tieneTutor ? this.tutor.apellido2.trim() || null : null,
      tutor_telefono: this.tieneTutor ? this.tutor.telefono.trim() || null : null,
      tutor_correo: this.tieneTutor ? this.tutor.correo.trim() || null : null,
      tutor_relacion: this.tieneTutor ? this.tutor.relacion.trim() || null : null,

      // direccion (campo names según backend)
      d_calle: this.direccion.calle.trim() || null,
      d_num_exterior: this.direccion.num_exterior.trim() || null,
      d_colonia: this.direccion.colonia.trim() || null,
      d_cp: this.direccion.cp.trim() || null,
      d_entidadfed: this.direccion.entidadfed.trim() || null,
      d_municipio: this.direccion.municipio.trim() || null,
      d_localidad: this.direccion.localidad.trim() || null
    };

    this.loading = true;
    this.registroService.registrarPacienteCompleto(payload).subscribe({
      next: (res: any) => {
        this.notify.success(res?.message || 'Paciente registrado correctamente');
        this.registrar.emit(res.paciente);
        this.cerrar.emit();
      },
      error: (err: any) => {
        const msg = err?.error?.message || err?.message || 'Error al registrar paciente';
        this.notify.error(msg);
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}

