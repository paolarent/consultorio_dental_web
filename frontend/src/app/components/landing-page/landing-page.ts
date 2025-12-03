import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { ServicioService } from '../../services/servicio.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  imports: [CommonModule],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.css'
})
export class LandingPage implements OnInit {
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;
  // Injecta AuthService para poder usarlo en el template
  auth = inject(AuthService);
  servicioService = inject(ServicioService);
  private router = inject(Router);

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

  scroll(direction: 'left' | 'right') {
    const el = this.scrollContainer.nativeElement;
    const scrollAmount = el.clientWidth * 0.8; // Desplazamiento dinámico
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  }

  goToCitas() {
    this.router.navigate(['/home/citas'], { replaceUrl: true });
  }
}