import { Component, computed, signal } from '@angular/core';
import { PacienteService } from '../../services/paciente.service';
import { TelefonoPipe } from '../../pipes/telefono.pipe';
import { ModalRegistroPaciente } from '../modal-registro-paciente/modal-registro-paciente';

@Component({
  selector: 'app-pacientes',
  imports: [TelefonoPipe, ModalRegistroPaciente],
  templateUrl: './pacientes.html',
  styleUrl: './pacientes.css'
})
export class Pacientes {
  pacientes = signal<any[]>([]);
  busqueda = signal<string>('');

  modalRegistrarPaciente = signal(false);

  pacientesFiltrados = computed(() => {
    const term = this.busqueda().toLowerCase();

    if (!term) return this.pacientes();

    return this.pacientes().filter(p =>
      `${p.nombre} ${p.apellido1} ${p.apellido2}`.toLowerCase().includes(term) ||
      p.usuario.correo.toLowerCase().includes(term) ||
      p.telefono.toString().includes(term)
    );
  });

  constructor(private pacienteService: PacienteService) {}

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

  cerrarModal() {
    this.modalRegistrarPaciente.set(false);
  }
}
