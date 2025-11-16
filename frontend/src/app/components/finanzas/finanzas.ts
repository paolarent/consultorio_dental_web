import { Component, signal } from '@angular/core';
import { ModalAgGasto } from "../modal-ag-gasto/modal-ag-gasto";

@Component({
  selector: 'app-finanzas',
  imports: [ModalAgGasto],
  templateUrl: './finanzas.html',
  styleUrl: './finanzas.css'
})
export class Finanzas {
  // Señal para mostrar/ocultar modal
  modalGastoAbierto = signal(false);

  // Abrir modal
  abrirModalGasto() {
    this.modalGastoAbierto.set(true);
  }

  // Cerrar modal
  cerrarModalGasto() {
    this.modalGastoAbierto.set(false);
  }

  // Ejemplo de callback cuando se agrega un gasto
  actualizarHistorial(nuevoGasto: any) {
    console.log('Gasto agregado:', nuevoGasto);
    this.cerrarModalGasto();
    // Aquí puedes actualizar la lista de gastos en tu historial
  }
}
