import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
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

  sendLogin() {
    if (!this.correo || !this.contrasena) {
      this.notify.error('Debes ingresar correo y contraseña');
      return;
    }

    this.loading.set(true);

    this.auth.login(this.correo, this.contrasena)
    .subscribe({
      next: (usuario: any) => {
        console.log('Login response:', usuario); //
        //const usuario = res; // res ya incluye paciente
        const nombre = usuario.paciente?.nombre || usuario.correo;

        // si el rol no es PACIENTE, mostrar mensaje y redirigir al form correcto
        if (usuario.rol.toLowerCase() !== 'paciente') {
            this.notify.error('Este es el login para pacientes, redirigiendo');

            setTimeout(() => {
                // redirigir al login general (doctores/admin)
                this.router.navigate(['/login'], { replaceUrl: true });
            }, 1000);

            this.loading.set(false); // detener loading
            return;
        }

        this.notify.success(`Bienvenido ${nombre}`, 'Inicio exitoso');
        //this.auth.setUsuario(usuario);
        this.router.navigate(['/home'], { replaceUrl: true });
      },
      error: (err) => {
        console.error(err);
        this.notify.error('Credenciales incorrectas o error del servidor');
      },
      complete: () => this.loading.set(false)
    });

  }

  gotoForgotPassword() {
    this.router.navigate(['/login/forgot-password'], { replaceUrl: true });
  }
}
