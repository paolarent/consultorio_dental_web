import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PacienteService } from '../../services/paciente.service';
import { ModalEditarPaciente } from '../modal-editar-paciente/modal-editar-paciente';
import { Paciente, UpdatePaciente } from '../../models/paciente.model';
import { AuthService } from '../../auth/auth.service';
import { NotificationService } from '../../services/notification.service';
import { Padecimientos } from '../padecimientos/padecimientos';

@Component({
  selector: 'app-perfil-paciente',
  imports: [CommonModule, ModalEditarPaciente, Padecimientos],
  templateUrl: './perfil-paciente.html',
  styleUrl: './perfil-paciente.css'
})
export class PerfilPaciente implements OnInit {
  private authService = inject(AuthService);
  private pacienteService = inject(PacienteService);
  private notify = inject(NotificationService);

  modalEditar = signal(false);

  paciente = signal<Paciente | null>(null);

  ngOnInit() {
    // Si ya hay un usuario en sesión, puede cargar el paciente desde aquí
    const usuario = this.authService.usuario();
    const id_paciente = usuario?.paciente?.id_paciente;

    if (id_paciente) {
      this.cargarPaciente(id_paciente);
    }

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
    const usuario = this.authService.usuario();
    const id_paciente = usuario?.paciente?.id_paciente;

    if (!id_paciente) {
      console.error('No se puede actualizar, falta ID del paciente en la sesión');
      return;
    }
    

    this.pacienteService.updatePaciente(id_paciente, updated).subscribe({
      next: (dataGuardada) => {
        this.paciente.set(dataGuardada);
        this.notify.success('Datos actualizados con éxito.');
        this.cerrarModal();
      },
      error: (err) => {
        this.notify.error('Error al actualizar los datos.');
        this.cargarPaciente(id_paciente); 
      }
    });

    //this.paciente.set(updated);
  }
  
}
