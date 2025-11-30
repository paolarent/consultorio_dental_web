import { Component, signal } from '@angular/core';
import { Calendario } from "../calendario/calendario";
import { ModalSolicCita } from '../modal-solic-cita/modal-solic-cita';

@Component({
  selector: 'app-citas-paciente',
  imports: [Calendario, ModalSolicCita],
  templateUrl: './citas-paciente.html',
  styleUrl: './citas-paciente.css'
})
export class CitasPaciente {
  modalSolicCita = signal(false);

  abrirModal() {
    this.modalSolicCita.set(true);
  }

  cerrarModal() {
    this.modalSolicCita.set(false);
  }


}
