import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
import { NotificationService } from '../../services/notification.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-form-restore-passw',
  imports: [CommonModule, FormsModule],
  templateUrl: './form-restore-passw.html',
  styleUrl: './form-restore-passw.css'
})
export class FormRestorePassw {
  private auth = inject(AuthService);
  private notify = inject(NotificationService);
  private router = inject(Router);

  correo = '';
  loading = signal(false);

  sendRecoveryEmail() {
    if (!this.correo) {
      this.notify.error('Debes ingresar tu correo');
      return;
    }

    this.loading.set(true);

    this.auth.solicitarRecuperacion(this.correo)
      .subscribe({
        next: (res: any) => {
          this.notify.success(res.message, 'Correo enviado');
          // Redirigir al login después de 2 segundos
          setTimeout(() => {
            this.router.navigate(['/login/paciente'], { replaceUrl: true });
          }, 2000);
        },
        error: (err: any) => {
          console.error(err);
          this.notify.error('Ocurrió un error al enviar el correo');
        },
        complete: () => this.loading.set(false)
      });
  }

  backLogin() {
    this.router.navigate(['/login/paciente'], { replaceUrl: true });
  }
}
