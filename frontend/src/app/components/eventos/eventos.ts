import { Component, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Calendario } from '../calendario/calendario';
import { ModalConfigHorario } from '../modal-config-horario/modal-config-horario';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { ModalEvento } from '../modal-evento/modal-evento';

@Component({
  selector: 'app-eventos',
  imports: [RouterModule, Calendario, ModalConfigHorario, MatFormFieldModule, MatSelectModule, MatOptionModule, ModalEvento],
  templateUrl: './eventos.html',
  styleUrl: './eventos.css'
})
export class Eventos {
  mostrarModalHorario = signal(false);
  modalEvento = signal(false);

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

  cerrarModalEvento() {
    this.modalEvento.set(false);
  }

  abrirModalEvento() {
    this.modalEvento.set(true);
  }
}
