import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PacienteService } from '../../services/paciente.service';
import { DatePipe, registerLocaleData } from '@angular/common';
import localeEsMx from '@angular/common/locales/es-MX';
import { NavExp } from '../nav-exp/nav-exp';
import { Filiacion } from '../filiacion/filiacion';
import { Padecimientos } from '../padecimientos/padecimientos';
import { HistorialTrat } from '../historial-trat/historial-trat';
import { ExpArchivo } from '../archivo/archivo';
import { ModalArchivo } from '../modal-archivo/modal-archivo';

registerLocaleData(localeEsMx);

@Component({
  selector: 'app-expediente',
  imports: [DatePipe, NavExp, Filiacion, Padecimientos, HistorialTrat, ExpArchivo],
  templateUrl: './expediente.html',
  styleUrl: './expediente.css'
})
export class Expediente {
  route = inject(ActivatedRoute);
  pacienteService = inject(PacienteService);

  paciente = signal<any | null>(null);
  currentTab = signal('filiacion');

  setTab(tab: string) {
    this.currentTab.set(tab);
  }

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.pacienteService.getPacienteById(id).subscribe({
      next: (data) => this.paciente.set(data),
      error: (err) => console.error(err)
    });
  }

  calcularEdad(fecha: string) {
    const nacimiento = new Date(fecha);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();

    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  }
}
