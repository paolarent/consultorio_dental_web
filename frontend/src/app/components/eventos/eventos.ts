import { Component, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Calendario } from '../calendario/calendario';
import { ModalConfigHorario } from '../modal-config-horario/modal-config-horario';

@Component({
  selector: 'app-eventos',
  imports: [RouterModule, Calendario, ModalConfigHorario],
  templateUrl: './eventos.html',
  styleUrl: './eventos.css'
})
export class Eventos {
  mostrarModalHorario = signal(false);

  constructor(private router: Router) {}

  irACitas() {
    this.router.navigate(['doc/mi-agenda/citas']); 
  }

  abrirModalHorario() {
    this.mostrarModalHorario.set(true);
  }

  cerrarModal() {
    this.mostrarModalHorario.set(false);
  }
}
