import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { FormLogin } from "../../components/form-login/form-login";

@Component({
  selector: 'app-login',
  imports: [CommonModule, RouterOutlet],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  
}
