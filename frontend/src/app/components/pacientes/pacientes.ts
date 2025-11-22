import { Component, computed, signal } from '@angular/core';
import { PacienteService } from '../../services/paciente.service';
import { TelefonoPipe } from '../../pipes/telefono.pipe';
import { ModalRegistroPaciente } from '../modal-registro-paciente/modal-registro-paciente';
import { RegistroService } from '../../services/registro.service';
import { ModalLogDelete } from '../modal-confirmar-logdelete/modal-confirmar-logdelete';
import { NotificationService } from '../../services/notification.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-pacientes',
  imports: [TelefonoPipe, ModalRegistroPaciente, ModalLogDelete, RouterModule],
  templateUrl: './pacientes.html',
  styleUrl: './pacientes.css'
})
export class Pacientes {
  pacientes = signal<any[]>([]);
  busqueda = signal<string>('');

  modalRegistrarPaciente = signal(false);
  modalEliminar = signal(false);
  pacienteSeleccionado = signal<any | null>(null);

  pacientesFiltrados = computed(() => {
    const term = this.busqueda().toLowerCase();

    if (!term) return this.pacientes();

    return this.pacientes().filter(p =>
      `${p.nombre} ${p.apellido1} ${p.apellido2}`.toLowerCase().includes(term) ||
      p.usuario.correo.toLowerCase().includes(term) ||
      p.telefono.toString().includes(term)
    );
  });

  constructor(
    private pacienteService: PacienteService,
    private registroService: RegistroService,
    private notify: NotificationService
  ) {}

  ngOnInit() {
    this.loadPacientes();
  }

  loadPacientes() {
    this.pacienteService.getPacientesActivosConsultorio()
      .subscribe({
        next: (data) => this.pacientes.set(data),
        error: (err) => console.error(err)
      });
  }

  calcularEdad(fecha: string) {
    const nacimiento = new Date(fecha);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();

    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  }

  registrarNuevoPaciente(nuevoPaciente: any) {
    this.pacientes.update(lista => [nuevoPaciente, ...lista]);
  }

  cerrarModal() {
    this.modalRegistrarPaciente.set(false);
  }

  abrirModalEliminar(paciente: any) {
  this.pacienteSeleccionado.set(paciente);
  this.modalEliminar.set(true);
}

  cancelarEliminacion() {
    this.modalEliminar.set(false);
    this.pacienteSeleccionado.set(null);
  }

  confirmarEliminacion() {
    const pac = this.pacienteSeleccionado();

    if (!pac) return;

    this.registroService.logicalDeletePacUser(pac.usuario.id_usuario, pac.id_paciente)
      .subscribe({
        next: () => {
          // Quitarlo de la lista
          this.pacientes.update(lista =>
            lista.filter(p => p.id_paciente !== pac.id_paciente)
          );

          this.cancelarEliminacion();
          this.notify.success('Paciente dado de baja correctamente.');
        },
        error: err => {
          console.error(err);
          this.notify.error('Error, no se pudo dar de baja al paciente');
        }
      });
  }

}
