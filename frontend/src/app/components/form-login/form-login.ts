import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { TogglePasswordDirective } from "../../directives/toggle-password.directive";
import { ToastrService } from 'ngx-toastr';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-form-login',
  imports: [CommonModule, TogglePasswordDirective],
  templateUrl: './form-login.html',
  styleUrl: './form-login.css'
})
export class FormLogin {
  constructor(private notify: NotificationService) {}

  submitForm() {
    // lógica de login (por ejemplo)
    this.notify.success('Inicio de sesión exitoso', 'Éxito');
  }
}
