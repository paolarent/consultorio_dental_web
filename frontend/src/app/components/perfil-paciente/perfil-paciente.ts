import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Alergia, AlergiasService } from '../../services/alergia.service';
import { CondicionMedica, CondicionesMedicasService } from '../../services/cond-med.service';
import { PacienteService } from '../../services/paciente.service';
import { ModalEditarPaciente } from '../modal-editar-paciente/modal-editar-paciente';
import { UpdatePaciente } from '../../models/update-paciente.model';
import { AuthService } from '../../auth/auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-perfil-paciente',
  imports: [CommonModule, ModalEditarPaciente],
  templateUrl: './perfil-paciente.html',
  styleUrl: './perfil-paciente.css'
})
export class PerfilPaciente implements OnInit {
  private authService = inject(AuthService);
  private pacienteService = inject(PacienteService);
  private notify = inject(NotificationService);

  modalEditar = signal(false);
  paciente = signal<UpdatePaciente | null>(null);
  
  constructor(
    private alergiasService: AlergiasService,
    private condicionesService: CondicionesMedicasService
  ) {}

  alergias: Alergia[] = [];
  condiciones: CondicionMedica[] = [];

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
}
