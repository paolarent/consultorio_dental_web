import { Component, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { CondicionMedica } from '../../models/get-condmed.model';
import { Alergia } from '../../models/get-alergia.model';
import { ModalLogDelete } from '../modal-confirmar-logdelete/modal-confirmar-logdelete';
import { ModalAgCondmed } from '../modal-ag-condmed/modal-ag-condmed';
import { ModalAgAlergia } from '../modal-ag-alergia/modal-ag-alergia';
import { CommonModule } from '@angular/common';
import { AlergiasService } from '../../services/alergia.service';
import { CondicionesMedicasService } from '../../services/cond-med.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-padecimientos',
  imports: [CommonModule, ModalAgAlergia, ModalAgCondmed, ModalLogDelete],
  templateUrl: './padecimientos.html',
  styleUrl: './padecimientos.css'
})
export class Padecimientos {
  @Input() idPaciente!: number;
  @Input() paciente?: any;

  private alergiasService = inject(AlergiasService);
  private condicionesService = inject(CondicionesMedicasService);
  private notify = inject(NotificationService);

  alergias: Alergia[] = [];
  condiciones: CondicionMedica[] = [];

  // ---- Manejo de modales dentro del componente ----
  modalAlergias = signal(false);
  modalCondMed = signal(false);
  modalConfirmacion = signal(false);

  // Datos para eliminar
  elementoAEliminar: { tipo: 'alergia' | 'condicion', id: number } | null = null;

  @Output() eliminar = new EventEmitter<{ tipo: string, id: number }>();

  ngOnInit() {
    this.cargarDatos();
  }

  private getPacienteId(): number | null {
    return this.idPaciente ?? this.paciente?.id_paciente ?? null;
  }

  private cargarDatos() {
    const pacienteId = this.getPacienteId();
    if (!pacienteId) {
      this.notify.error('No se proporcionó paciente ni idPaciente');
      return;
    }

    // Listar alergias
    this.alergiasService.listarAlergiasPaciente(pacienteId).subscribe({
      next: (data) => (this.alergias = data),
      error: (err) => console.error('Error al obtener alergias', err),
    });

    // Listar condiciones médicas
    this.condicionesService.listarCMPaciente(pacienteId).subscribe({
      next: (data) => {
        this.condiciones = data.map((cond) => ({
          ...cond,
          medicamentos_formateados: Array.isArray(cond.medicamentos_actuales)
            ? cond.medicamentos_actuales.join(', ')
            : cond.medicamentos_actuales,
        }));
      },
      error: (err) => console.error('Error al obtener condiciones médicas', err),
    });
  }

  agregarAlergia(dto: any) {
    const pacienteId = this.getPacienteId();
    if (!pacienteId) {
      this.notify.error('No se proporcionó paciente ni idPaciente');
      return;
    }

    const body = { ...dto, id_paciente: pacienteId };
    this.alergiasService.agregarAlergia(body).subscribe({
      next: (nueva) => {
        // Agrega la nueva alergia al array local
        this.alergias = [...this.alergias, nueva];
        this.notify.success('Alergia agregada');
        this.modalAlergias.set(false); // cierra modal al terminar
      },
      error: (err) => console.error('Error al agregar alergia', err)
    });
  }

  agregarCondMed(dto: any) {
    const pacienteId = this.getPacienteId();
    if (!pacienteId) {
      this.notify.error('No se proporcionó paciente ni idPaciente');
      return;
    }

    const body = { ...dto, id_paciente: pacienteId };

    this.condicionesService.agregarCondicion(body).subscribe({
      next: (nueva) => {
        //Si viene como string (por ejemplo '["Insulina"]'), lo convertimos a array
        if (typeof nueva.medicamentos_actuales === 'string') {
          try {
            nueva.medicamentos_actuales = JSON.parse(nueva.medicamentos_actuales);
          } catch {
            nueva.medicamentos_actuales = [];
          }
        }

        // Asegurar texto formateado para mostrarlo en el textarea
        nueva.medicamentos_formateados =
          nueva.medicamentos_actuales.length > 0
            ? nueva.medicamentos_actuales.join(', ')
            : 'No medicación';

        //para actualizar lista local sin mutar el array original
        this.condiciones = [...this.condiciones, nueva];

        this.notify.success('Condición médica agregada correctamente');
        this.modalCondMed.set(false);
      },
      error: (err) => {
        console.error('Error al agregar condición médica', err);
        this.notify.error('Error al agregar la condición médica');
      },
    });
  }

  abrirModalEliminar(tipo: 'alergia' | 'condicion', id: number) {
    this.elementoAEliminar = { tipo, id };
    this.modalConfirmacion.set(true);
  }

  confirmarEliminacion() {
    if (!this.elementoAEliminar) return;

    const { tipo, id } = this.elementoAEliminar;

    const pacienteId = this.getPacienteId();
    if (!pacienteId) {
      this.notify.error('No se proporcionó paciente ni idPaciente');
      return;
    }

    if (tipo === 'alergia') {
      this.alergiasService.desactivarAlergia(id).subscribe({
        next: () => {
          this.alergias = this.alergias.filter(a => a.id_alergia !== id);
          this.notify.success('Alergia eliminada correctamente');
          this.modalConfirmacion.set(false);
        },
        error: () => this.notify.error('Error al eliminar la alergia')
      });
    } else {
      this.condicionesService.desactivarCondicion(id).subscribe({
        next: () => {
          this.condiciones = this.condiciones.filter(c => c.id_condicion_medica !== id);
          this.notify.success('Condición médica eliminada correctamente');
          this.modalConfirmacion.set(false);
        },
        error: () => this.notify.error('Error al eliminar la condición médica')
      });
    }

    this.modalConfirmacion.set(false);
    this.elementoAEliminar = null;
  }

}
