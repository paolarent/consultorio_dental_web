import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlergiasService } from '../../services/alergia.service';
import { CondicionesMedicasService } from '../../services/cond-med.service';
import { PacienteService } from '../../services/paciente.service';
import { ModalEditarPaciente } from '../modal-editar-paciente/modal-editar-paciente';
import { UpdatePaciente } from '../../models/update-paciente.model';
import { AuthService } from '../../auth/auth.service';
import { NotificationService } from '../../services/notification.service';
import { Alergia } from '../../models/get-alergia.model';
import { CondicionMedica } from '../../models/get-condmed.model';
import { ModalAgAlergia } from '../modal-ag-alergia/modal-ag-alergia';
import { ModalAgCondmed } from '../modal-ag-condmed/modal-ag-condmed';
import { ModalLogDelete } from '../modal-confirmar-logdelete/modal-confirmar-logdelete';

@Component({
  selector: 'app-perfil-paciente',
  imports: [CommonModule, ModalEditarPaciente, ModalAgAlergia, ModalAgCondmed, ModalLogDelete],
  templateUrl: './perfil-paciente.html',
  styleUrl: './perfil-paciente.css'
})
export class PerfilPaciente implements OnInit {
  private authService = inject(AuthService);
  private pacienteService = inject(PacienteService);
  private notify = inject(NotificationService);

  modalEditar = signal(false);
  modalAlergias = signal(false);
  modalCondMed = signal(false);

  paciente = signal<UpdatePaciente | null>(null);
  
  constructor(
    private alergiasService: AlergiasService,
    private condicionesService: CondicionesMedicasService,
  ) {}

  alergias: Alergia[] = [];
  condiciones: CondicionMedica[] = [];

  modalConfirmacion = signal(false);
  elementoAEliminar: { tipo: 'alergia' | 'condicion', id: number } | null = null;

  ngOnInit() {
    // Si ya hay un usuario en sesión, puede cargar el paciente desde aquí
    const usuario = this.authService.usuario();
    const id_paciente = usuario?.paciente?.id_paciente;

    if (id_paciente) {
      this.cargarPaciente(id_paciente);
    }

    // Cargar alergias
    this.alergiasService.listarAlergiasPaciente().subscribe({
      next: (data) => (this.alergias = data),
      error: (err) => console.error('Error al obtener alergias', err),
    });

    // Cargar condiciones médicas
    this.condicionesService.listarCMPaciente().subscribe({
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

  cargarPaciente(id_paciente: number) {
    this.pacienteService.getPacienteById(id_paciente).subscribe({
      next: (data) => this.paciente.set(data),
      error: (err) => console.error('Error al cargar paciente', err),
    });
  }

  abrirModalEditarPac() {
    const usuario = this.authService.usuario();// obtiene datos del usuario activo
    const id_paciente = usuario?.paciente?.id_paciente;

    if (!id_paciente) {
      console.error('No se encontró id_paciente en la sesión');
      return;
    }

    // Refrescamos los datos desde la BD antes de abrir el modal
    this.pacienteService.getPacienteById(id_paciente).subscribe({
      next: (data) => {
        this.paciente.set(data);
        this.modalEditar.set(true); // Ahora sí abrimos el modal
      },
      error: (err) => console.error('Error al cargar paciente antes de editar', err),
    });
  }


  cerrarModal() {
    this.modalEditar.set(false);
  }

  actualizarPaciente(updated: UpdatePaciente) {
    if (!updated.id_paciente) {
      console.error('No se puede actualizar, falta el ID del paciente');
      return;
    }

    this.pacienteService.updatePaciente(updated.id_paciente, updated).subscribe({
      next: (dataGuardada) => {
        this.paciente.set(dataGuardada);
        this.notify.success('Datos actualizados con éxito.');
        //console.log('Paciente actualizado en la BD con exito');
        this.cerrarModal();
      },
      error: (err) => {
        this.notify.error('Error al actualizar los datos.');
        //console.error('Error al actualizar paciente en la BD', err)
      }
    })

    //this.paciente.set(updated);
  }

  agregarAlergia(dto: any) {
    this.alergiasService.agregarAlergia(dto).subscribe({
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
    this.condicionesService.agregarCondicion(dto).subscribe({
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

  cancelarEliminacion() {
    this.modalConfirmacion.set(false);
    this.elementoAEliminar = null;
  }

  confirmarEliminacion() {
    if (!this.elementoAEliminar) return;

    const { tipo, id } = this.elementoAEliminar;

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

    this.elementoAEliminar = null;
  }

}
