import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { TogglePasswordDirective } from '../../directives/toggle-password';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
import { NotificationService } from '../../services/notification.service';
import { ActivatedRoute, Router } from '@angular/router';
import { RegistroService } from '../../services/registro.service';

@Component({
  selector: 'app-form-new-passw',
  imports: [CommonModule, TogglePasswordDirective, FormsModule],
  templateUrl: './form-new-passw.html',
  styleUrl: './form-new-passw.css'
})
export class FormNewPassw {
  private auth = inject(AuthService);
  private registroService = inject(RegistroService);
  private notify = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  token = '';
  nueva = '';
  confirmar = '';
  loading = signal(false);
  tipo = '';

  constructor() {
    // Capturamos token del query param
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    const tipoParam = this.route.snapshot.queryParamMap.get('tipo');
    this.tipo = tipoParam === 'registro' ? 'registro' : 'restablecer';
  }

  get titulo() {
    return this.tipo === 'registro' ? 'COMPLETA TU REGISTRO' : 'CAMBIAR CONTRASEÑA';
  }

  get descripcion() {
    return this.tipo === 'registro'
      ? 'Crea tu contraseña para activar y acceder a tu cuenta'
      : 'Ingrese su nueva contraseña y confirmela';
  }

  // Labels para los inputs
  get labelNueva() {
    return this.tipo === 'registro' ? 'Crear Contraseña' : 'Nueva Contraseña';
  }

  get labelConfirmar() {
    return this.tipo === 'registro' ? 'Confirma tu contraseña' : 'Confirme su nueva contraseña';
  }

  submitNewPassword() {
    if (!this.nueva || !this.confirmar) {
      this.notify.error('Debes completar todos los campos');
      return;
    }
    if (this.nueva !== this.confirmar) {
      this.notify.error('Las contraseñas no coinciden');
      return;
    }

    this.loading.set(true);

     // Llamada al backend
    const obs$ = this.tipo === 'registro'
      ? this.registroService.confirmRegistroContrasena(this.token, this.nueva) // nuevo método para el registro
      : this.auth.restablecerContrasena(this.token, this.nueva);

    obs$.subscribe({
        next: () => {
          this.notify.success(
            this.tipo === 'registro'
              ? 'Registro completado correctamente.'
              : 'Contraseña actualizada correctamente.'
          );
          this.router.navigate(['/login/paciente'], { replaceUrl: true });
        },
        error: (err: any) => {
          console.error(err);
          this.notify.error('Token inválido o expirado');
        },
        complete: () => this.loading.set(false)
      });
    }
    
}
