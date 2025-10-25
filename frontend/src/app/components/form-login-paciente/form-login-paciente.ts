import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TogglePasswordDirective } from "../../directives/toggle-password.directive";

@Component({
  selector: 'app-form-login-paciente',
  imports: [CommonModule, TogglePasswordDirective],
  templateUrl: './form-login-paciente.html',
  styleUrl: './form-login-paciente.css'
})
export class FormLoginPaciente {

}
