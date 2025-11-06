import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { ServicioService } from '../../services/servicio.service';

@Component({
  selector: 'app-landing-page',
  imports: [CommonModule],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.css'
})
export class LandingPage implements OnInit {
  // Injecta AuthService para poder usarlo en el template
  auth = inject(AuthService);
  servicioService = inject(ServicioService);

  // Signals
  servicios = signal<any[]>([]);

  ngOnInit() {
    const usuario = this.auth.usuario(); //signal de usuario

    // Si tiene id_consultorio, obtenemos los servicios de ese consultorio
    if (usuario?.id_consultorio) {
      this.servicioService.findAllActive(usuario.id_consultorio).subscribe({
        next: (data) => this.servicios.set(data),
        error: (err) => console.error(err)
      });
    }
  }
}