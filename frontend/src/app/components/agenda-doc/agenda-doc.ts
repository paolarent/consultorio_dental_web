import { Component, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Calendario } from '../calendario/calendario';
import { ModalConfigHorario } from '../modal-config-horario/modal-config-horario';
import { ModalCreateCita } from '../modal-create-cita/modal-create-cita';

@Component({
  selector: 'app-agenda-doc',
  imports: [RouterModule, Calendario, ModalConfigHorario, ModalCreateCita],
  templateUrl: './agenda-doc.html',
  styleUrl: './agenda-doc.css'
})
export class AgendaDoc {
  modalHorario = signal(false);
  modalCrearCita = signal(false);

  constructor(private router: Router) {}

  irAEventos() {
    this.router.navigate(['doc/mi-agenda/eventos']);
  }

  abrirModalHorario() {
    this.modalHorario.set(true);
  }

  cerrarModalHorario() {
    this.modalHorario.set(false);
  }

  abrirModalCrearCita() {
    this.modalCrearCita.set(true);
  }

  cerrarModalCrearCita() {
    this.modalCrearCita.set(false);
  }


}
