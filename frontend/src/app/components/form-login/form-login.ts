import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { TogglePasswordDirective } from "../../directives/toggle-password.directive";
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../auth/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize, switchMap, take } from 'rxjs/operators';

@Component({
  selector: 'app-form-login',
  imports: [CommonModule, TogglePasswordDirective, FormsModule],
  templateUrl: './form-login.html',
  styleUrl: './form-login.css'
})
export class FormLogin {
  private auth = inject(AuthService);
  private notify = inject(NotificationService);
  private router = inject(Router);

  correo = '';
  contrasena = '';
  loading = signal(false);

  submitForm() {
    if (!this.correo || !this.contrasena) {
      this.notify.error('Debes ingresar correo y contraseña');
      return;
    }

    this.loading.set(true);

    this.auth.login(this.correo, this.contrasena)
    .subscribe({
      next: (res: any) => {
        console.log('Login response:', res); //
        const usuario = res; // res ya incluye paciente
        const nombre = usuario.paciente?.nombre || usuario.correo;
        this.notify.success(`Bienvenido ${nombre}`, 'Inicio exitoso');
        this.auth.setUsuario(usuario);
        this.router.navigate(['/'], { replaceUrl: true });
      },
      error: (err) => {
        console.error(err);
        this.notify.error('Credenciales incorrectas o error del servidor');
      },
      complete: () => this.loading.set(false)
    });

  }
}
