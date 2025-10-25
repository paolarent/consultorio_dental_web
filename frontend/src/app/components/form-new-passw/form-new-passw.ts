import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TogglePasswordDirective } from '../../directives/toggle-password.directive';

@Component({
  selector: 'app-form-new-passw',
  imports: [CommonModule, TogglePasswordDirective],
  templateUrl: './form-new-passw.html',
  styleUrl: './form-new-passw.css'
})
export class FormNewPassw {

}
