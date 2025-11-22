import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Sexo, SiONo } from '../../../../../backend/src/common/enums';
import { PacienteService } from '../../services/paciente.service';
import { NotificationService } from '../../services/notification.service';
import flatpickr from 'flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es.js';

@Component({
  selector: 'app-filiacion',
  imports: [CommonModule, FormsModule],
  templateUrl: './filiacion.html',
  styleUrl: './filiacion.css'
})
export class Filiacion {

}
