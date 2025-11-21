import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { TogglePasswordDirective } from "../../directives/toggle-password";
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
import { NotificationService } from '../../services/notification.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-form-login-paciente',
  imports: [CommonModule, TogglePasswordDirective, FormsModule],
  templateUrl: './form-login-paciente.html',
  styleUrl: './form-login-paciente.css'
})
export class FormLoginPaciente {
  private auth = inject(AuthService);
  private notify = inject(NotificationService);
  private router = inject(Router);

  correo = '';
  contrasena = '';
  loading = signal(false);

  constructor() {
    // Efecto que escucha cuando _usuario se setea y redirige automáticamente
    effect(() => {
      const usuario = this.auth.usuario(); // Signal de solo lectura
      if (usuario && usuario.rol.toLowerCase() === 'paciente') {
        this.router.navigate(['/home'], { replaceUrl: true });
      }
    });
  }

  sendLogin() {
    if (!this.correo || !this.contrasena) {
      this.notify.error('Debes ingresar correo y contraseña');
      return;
    }

    this.loading.set(true);

    this.auth.login(this.correo, this.contrasena).subscribe({
      next: (usuario: any) => {
        const nombre = usuario.paciente?.nombre || usuario.correo;

        if (usuario.rol.toLowerCase() !== 'paciente') {
          this.notify.error('Este es el login para pacientes, redirigiendo');
          setTimeout(() => this.router.navigate(['/login'], { replaceUrl: true }), 1000);
          this.loading.set(false);
          return;
        }

        this.notify.success(`Bienvenido ${nombre}`, 'Inicio exitoso');
        this.auth.setUsuario(usuario); // Esto disparará el effect
      },
      error: (err) => {
        console.error(err);

        const backendMsg = err?.error?.message;

        if (backendMsg === 'Debes verificar tu correo para poder iniciar sesión') {
          this.notify.warning('Correo no verificado. Revisa tu correo.');
          this.loading.set(false);
          return;
        }

        if (backendMsg === 'Correo o contraseña incorrectos') {
          this.notify.error('Correo o contraseña incorrectos');
          this.loading.set(false);
          return;
        }

        this.notify.error('Error del servidor, intenta más tarde');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false)
    });
  }

  gotoForgotPassword() {
    this.router.navigate(['/login/forgot-password'], { replaceUrl: true });
  }
}
