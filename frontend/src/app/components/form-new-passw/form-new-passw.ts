import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { TogglePasswordDirective } from '../../directives/toggle-password';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
import { NotificationService } from '../../services/notification.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-form-new-passw',
  imports: [CommonModule, TogglePasswordDirective, FormsModule],
  templateUrl: './form-new-passw.html',
  styleUrl: './form-new-passw.css'
})
export class FormNewPassw {
  private auth = inject(AuthService);
  private notify = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  token = '';
  nueva = '';
  confirmar = '';
  loading = signal(false);

  constructor() {
    // Capturamos token del query param
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
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

    this.auth.restablecerContrasena(this.token, this.nueva)
      .subscribe({
        next: () => {
          this.notify.success('Contraseña actualizada correctamente.');
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
