import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { TogglePasswordDirective } from "../../directives/toggle-password";
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../auth/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

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

  sendLoginDA() {
    if (!this.correo || !this.contrasena) {
      this.notify.error('Debes ingresar correo y contraseña');
      return;
    }

    this.loading.set(true);

    this.auth.login(this.correo, this.contrasena)
    .subscribe({
      next: (usuario: any) => {

         // Verificar rol paciente para redirigir
        if (usuario.rol.toLowerCase() === 'paciente') {
          this.auth.clearSession();
          this.notify.error('Este no es el login de paciente, redirigiendo');
          setTimeout(() => this.router.navigate(['/login/paciente'], { replaceUrl: true }), 1000);
          this.loading.set(false);
          return;
        }
        
        // Mensaje según rol
        let mensajeBienvenida = '';
        if (usuario.rol.toLowerCase() === 'dentista') {
          // Mostrar nombre del titular del consultorio
          const titular = usuario.consultorio?.titular_nombre || 'Doctor';
          mensajeBienvenida = `Bienvenido Dr. ${titular}`;
        } else if (usuario.rol.toLowerCase() === 'admin') {
          mensajeBienvenida = 'Bienvenido Admin';
        } else {
          mensajeBienvenida = `Bienvenido ${usuario.correo}`;
        }

      this.notify.success(mensajeBienvenida, 'Inicio exitoso');
        
        this.router.navigate(['/doc'], { replaceUrl: true });
      },
      error: (err) => {
        console.error(err);
        this.notify.error('Credenciales incorrectas o error del servidor');
      },
      complete: () => this.loading.set(false)
    });

  }
}
