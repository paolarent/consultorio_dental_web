import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-eventos',
  imports: [RouterModule],
  templateUrl: './eventos.html',
  styleUrl: './eventos.css'
})
export class Eventos {
  constructor(private router: Router) {}

  irACitas() {
    this.router.navigate(['doc/mi-agenda/citas']); 
  }
}
