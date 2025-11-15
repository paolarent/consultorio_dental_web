import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-agenda-doc',
  imports: [RouterModule],
  templateUrl: './agenda-doc.html',
  styleUrl: './agenda-doc.css'
})
export class AgendaDoc {
  constructor(private router: Router) {}

  irAEventos() {
    this.router.navigate(['doc/mi-agenda/eventos']); 
  }
}
