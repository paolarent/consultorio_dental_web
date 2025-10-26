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

  logout() {
    this.auth.logout().subscribe({
      next: () => this.router.navigate(['/login/paciente'], { replaceUrl: true }),
      error: (err) => console.error('Error al cerrar sesión', err)
    });
  }
}

