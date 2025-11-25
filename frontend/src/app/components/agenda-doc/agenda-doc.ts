import { Component, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Calendario } from '../calendario/calendario';
import { ModalConfigHorario } from '../modal-config-horario/modal-config-horario';

@Component({
  selector: 'app-agenda-doc',
  imports: [RouterModule, Calendario, ModalConfigHorario],
  templateUrl: './agenda-doc.html',
  styleUrl: './agenda-doc.css'
})
export class AgendaDoc {
  mostrarModalHorario = signal(false);

  constructor(private router: Router) {}

  irAEventos() {
    this.router.navigate(['doc/mi-agenda/eventos']);
  }

  abrirModalHorario() {
    this.mostrarModalHorario.set(true);
  }

  cerrarModal() {
    this.mostrarModalHorario.set(false);
  }
}
