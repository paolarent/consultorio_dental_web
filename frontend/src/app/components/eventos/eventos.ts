import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Calendario } from '../calendario/calendario';

@Component({
  selector: 'app-eventos',
  imports: [RouterModule, Calendario],
  templateUrl: './eventos.html',
  styleUrl: './eventos.css'
})
export class Eventos {
  constructor(private router: Router) {}

  irACitas() {
    this.router.navigate(['doc/mi-agenda/citas']); 
  }
}
