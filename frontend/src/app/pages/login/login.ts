import { Component } from '@angular/core';
import { FormLogin } from '../../components/form-login/form-login';
import { CommonModule } from '@angular/common';
import { FormLoginPaciente } from '../../components/form-login-paciente/form-login-paciente';

@Component({
  selector: 'app-login',
  imports: [FormLogin, FormLoginPaciente, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

}
