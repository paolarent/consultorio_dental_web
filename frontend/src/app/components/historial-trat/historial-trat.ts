import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { HistorialService } from '../../services/historial.service';
import { CommonModule, DatePipe } from '@angular/common';
import { ModalHistorialAgup } from '../modal-historial-agup/modal-historial-agup';
import { FormsModule } from '@angular/forms';
import { ModalLogDelete } from '../modal-confirmar-logdelete/modal-confirmar-logdelete';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-historial-trat',
  imports: [CommonModule, ModalHistorialAgup, FormsModule, ModalLogDelete],
  templateUrl: './historial-trat.html',
  styleUrl: './historial-trat.css'
})

export class HistorialTrat implements OnInit {
    @Input() paciente!: { id_paciente: number }; // se recibe comp expediente
    historial: Historial[] = [];
    cargando: boolean = false;

    busqueda = signal('');
    //modal para el softdelete
    modalConfirmacion = signal(false);
    historialAEliminar?: number;
    ModalAgUpTratamiento = signal(false);
    historialSeleccionado?: Historial;

    constructor(private historialService: HistorialService) {}
    private notify = inject(NotificationService)

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

    get historialFiltrado(): Historial[] {
      const texto = this.busqueda();
      if (!texto) return this.historial;
      
      return this.historial.filter(h =>
        h.descripcion.toLowerCase().includes(texto.toLowerCase()) ||
        h.servicio.nombre.toLowerCase().includes(texto.toLowerCase())
      );
    }


    formatFecha(fechaISO: string): string {
      if (!fechaISO) return '';

      // separar año, mes, día
      const [year, month, day] = fechaISO.split('-').map(Number);
      // crear Date local (mes en JS es 0-indexado)
      const date = new Date(year, month - 1, day);

      return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
    }


    abrirModalNuevo() {
      this.historialSeleccionado = undefined;  // Modo registro
      this.ModalAgUpTratamiento.set(true);
    }

    editarTratamiento(h: Historial) {
        this.historialSeleccionado = h; //abrir en modo edicion
        this.ModalAgUpTratamiento.set(true);
    }

    cerrarModal() {
      this.ModalAgUpTratamiento.set(false);
    }

    agregarHistorial(nuevo: any) {
      this.cerrarModal(); //cerrar el modal al agregar
      this.obtenerHistorial();
    }

  abrirModalEliminar(id_historial: number) {
    this.historialAEliminar = id_historial;
    this.modalConfirmacion.set(true);
  }

    cerrarModalSD() {
      this.modalConfirmacion.set(false);
      this.historialAEliminar = undefined;
    }

    confirmarSoftDelete() {
      if (!this.historialAEliminar) return;

      this.historialService.desactivarHistorial(this.historialAEliminar)
        .subscribe({
          next: () => {
            this.obtenerHistorial(); // recarga la lista
            this.cerrarModalSD();     // cierra modal

            this.notify.success("Registro de tratamiento eliminado");
          },
          error: () => {
            this.notify.error("Error al eliminar el registro");
          }
        });
  }

}
