import { Component, inject, OnInit, signal } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar {
  auth = inject(AuthService);
  private router = inject(Router);

  menuAbierto = signal(false);  //estado del menu reactivo

  menuDesplegable() {
    this.menuAbierto.update(v => !v);
  }

  verPerfil() {
    //redirigir al perfil del usuario
    this.router.navigate(['']);
    this.menuAbierto.set(false);
  }

  cerrarSesion() {
    this.auth.logout().subscribe({
      next: () => {
        this.menuAbierto.set(false);
        this.router.navigate(['/login/paciente'], {replaceUrl: true});
      },
        error: (err) => console.error('Error al cerrar sesion', err)
    });
  }
}

