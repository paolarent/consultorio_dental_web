import { Component, inject, signal } from '@angular/core';
import { ModalAgGasto } from "../modal-ag-gasto/modal-ag-gasto";
import { EgresoService } from '../../services/gasto-egreso.service';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-finanzas',
  imports: [ModalAgGasto, DecimalPipe],
  templateUrl: './finanzas.html',
  styleUrl: './finanzas.css'
})
export class Finanzas {
  private egresoService = inject(EgresoService);

  totalGastos: number = 0;
  totalGastosMes: number = 0;


  ngOnInit(): void {
    // cargar total de egresos del consultorio
    this.egresoService.totalGastos().subscribe({
      next: (res) => this.totalGastos = res.total,
      error: (err) => console.error('Error al cargar total de gastos', err)
    });

    this.egresoService.totalGastosMes().subscribe({
      next: res => this.totalGastosMes = res.total,
      error: err => console.error('Error al cargar gastos del mes', err)
    });
  }


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
