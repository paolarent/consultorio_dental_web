import { Component, Input, OnInit, signal } from '@angular/core';
import { HistorialService } from '../../services/historial.service';
import { CommonModule, DatePipe } from '@angular/common';
import { ModalHistorialAgup } from '../modal-historial-agup/modal-historial-agup';

@Component({
  selector: 'app-historial-trat',
  imports: [CommonModule, ModalHistorialAgup],
  templateUrl: './historial-trat.html',
  styleUrl: './historial-trat.css'
})

export class HistorialTrat implements OnInit {
    @Input() paciente!: { id_paciente: number }; // se recibe comp expediente
    historial: Historial[] = [];
    cargando: boolean = false;

    ModalAgUpTratamiento = signal(false);

    constructor(private historialService: HistorialService) {}

    ngOnInit(): void {
      if (this.paciente) {
        this.obtenerHistorial();
      }
    }

    obtenerHistorial() {
      this.cargando = true;
      this.historialService.listarHistorial(this.paciente.id_paciente)
        .subscribe({
          next: (res: Historial[]) => {
            this.historial = res;
            this.cargando = false;
          },
          error: (err) => {
            console.error(err);
            this.cargando = false;
          }
        });
    }

    formatFecha(fechaISO: string): string {
      if (!fechaISO) return '';

      // separar año, mes, día
      const [year, month, day] = fechaISO.split('-').map(Number);
      // crear Date local (mes en JS es 0-indexado)
      const date = new Date(year, month - 1, day);

      return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
    }


    abrirModal() {
      this.ModalAgUpTratamiento.set(true);
    }

    cerrarModal() {
      this.ModalAgUpTratamiento.set(false);
    }

    agregarHistorial(nuevo: any) {
      this.cerrarModal(); //cerrar el modal al agregar
      this.obtenerHistorial();
    }

}
