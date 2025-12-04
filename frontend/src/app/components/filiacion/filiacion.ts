import { Component, ElementRef, EventEmitter, inject, Input, OnInit, Output, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { NotificationService } from '../../services/notification.service';
import { FormsModule, NgForm } from '@angular/forms';
import { Sexo, SiONo } from '../../shared/enums';
import flatpickr from 'flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es.js';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { CommonModule } from '@angular/common';
import { PacienteService } from '../../services/paciente.service';

@Component({
  selector: 'app-filiacion',
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatSelectModule, MatOptionModule],
  templateUrl: './filiacion.html',
  styleUrl: './filiacion.css'
})
export class Filiacion implements OnInit, OnChanges {
  private notify = inject(NotificationService);
  private pacienteService = inject(PacienteService);

  @Output() actualizado = new EventEmitter<any>();  
  @Input() paciente: any;

  @ViewChild('fechaInput', { static: false }) fechaInput!: ElementRef<HTMLInputElement>;

  private fpInstance: any;

  loading = false;

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
    this.initFlatpickr();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['paciente'] && this.paciente) {
      this.cargarDatosPaciente();
    }
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

  private cargarDatosPaciente() {
    // --- Datos básicos ---
    this.nombre = this.paciente.nombre || '';
    this.apellido1 = this.paciente.apellido1 || '';
    this.apellido2 = this.paciente.apellido2 || '';
    this.telefono = this.paciente.telefono || '';
    this.correo = this.paciente.usuario?.correo || '';
    this.fechaNacimiento = this.paciente.fecha_nacimiento ? this.paciente.fecha_nacimiento.split('T')[0] : '';
    this.sexo = this.paciente.sexo || null;

    // --- Tutor ---
    this.tieneTutor = this.paciente.tiene_tutor === 'si';

    this.tutor = {
      nombre: this.paciente.tutor_nombre || '',
      apellido1: this.paciente.tutor_apellido1 || '',
      apellido2: this.paciente.tutor_apellido2 || '',
      telefono: this.paciente.tutor_telefono || '',
      correo: this.paciente.tutor_correo || '',
      relacion: this.paciente.tutor_relacion || '',
    };

    // Si no tiene tutor, desactivamos y limpiamos
    if (!this.tieneTutor) {
      this.tutor = {
        nombre: '',
        apellido1: '',
        apellido2: '',
        telefono: '',
        correo: '',
        relacion: '',
      };
    }

    // --- Dirección ---
    this.direccion = {
      calle: this.paciente.d_calle || '',
      num_exterior: this.paciente.d_num_exterior || '',
      colonia: this.paciente.d_colonia || '',
      cp: this.paciente.d_cp || '',
      entidadfed: this.paciente.d_entidadfed || '',
      municipio: this.paciente.d_municipio || '',
      localidad: this.paciente.d_localidad || '',

    };

    setTimeout(() => {
      if (this.fpInstance) {
        this.fpInstance.setDate(this.fechaNacimiento);
      } else {
        this.initFlatpickr(); // si no existe, lo generamos, es bien batalloso (tener cuidado)
      }
    }, 50);

  }

  actualizarPaciente() {
    if (!this.camposObligatorios()) {
      this.notify.warning("Por favor llena todos los campos obligatorios.");
      return;
    }

    if (!this.paciente?.id_paciente) {
      this.notify.error("No se puede actualizar: no hay ID del paciente.");
      return;
    }

    const payload: any = {
      // datos paciente
      nombre: this.nombre.trim(),
      apellido1: this.apellido1.trim(),
      apellido2: this.apellido2?.trim() || null,
      telefono: this.telefono?.trim() || null,
      fecha_nacimiento: this.fechaNacimiento || null,
      sexo: this.sexo,

      // tutor
      tiene_tutor: this.tieneTutor ? SiONo.SI : SiONo.NO,
      tutor_nombre: this.tieneTutor ? this.tutor.nombre.trim() || null : null,
      tutor_apellido1: this.tieneTutor ? this.tutor.apellido1.trim() || null : null,
      tutor_apellido2: this.tieneTutor ? this.tutor.apellido2.trim() || null : null,
      tutor_telefono: this.tieneTutor ? this.tutor.telefono.trim() || null : null,
      tutor_correo: this.tutor.correo?.trim() || null,
      tutor_relacion: this.tutor.relacion?.trim() || null,

      // direccion
      d_calle: this.direccion.calle.trim() || null,
      d_num_exterior: this.direccion.num_exterior.trim() || null,
      d_colonia: this.direccion.colonia.trim() || null,
      d_cp: this.direccion.cp.trim() || null,
      d_entidadfed: this.direccion.entidadfed.trim() || null,
      d_municipio: this.direccion.municipio.trim() || null,
      d_localidad: this.direccion.localidad.trim() || null,
    };

    this.loading = true;

    this.pacienteService.updatePaciente(this.paciente.id_paciente, payload).subscribe({
      next: (res: any) => {
        this.notify.success("Paciente actualizado correctamente.");

        // refrescar datos padre (teoricamente)
        this.actualizado.emit(res);

        this.loading = false;
      },
      error: (err: any) => {
        this.notify.error(err?.error?.message || "Error al actualizar paciente");
        this.loading = false;
      }
    });
  }

  private camposObligatorios(): boolean {
    if (!this.nombre.trim()) return false;
    if (!this.apellido1.trim()) return false;
    if (!this.fechaNacimiento) return false;
    if (!this.sexo) return false;
    return true;
  }


}