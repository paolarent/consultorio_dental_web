import { Component, inject, OnInit, signal } from '@angular/core';
import { ModalAgGasto } from "../modal-ag-gasto/modal-ag-gasto";
import { EgresoService } from '../../services/gasto-egreso.service';
import { DecimalPipe } from '@angular/common';
import { IngresoService } from '../../services/ingreso.service';
import { ModalMontoInicial } from '../modal-monto-inicial/modal-monto-inicial';

@Component({
  selector: 'app-finanzas',
  imports: [ModalAgGasto, DecimalPipe, ModalMontoInicial],
  templateUrl: './finanzas.html',
  styleUrl: './finanzas.css'
})
export class Finanzas implements OnInit{
  private egresoService = inject(EgresoService);
  constructor(private ingresoService: IngresoService) {}

  totalGastos: number = 0;
  totalGastosMes: number = 0;

  corteAbierto: any = null;   // guarda el corte abierto
  btnCajaTexto: string = 'Abrir Caja';
  ingresoDisabled: boolean = true;

  //MODALES
  // Señales
  modalGastoAbierto = signal(false);
  modalMontoInicial = signal(false);


  ngOnInit(): void {
    this.verificarCorte();

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

  // Revisar si hay corte abierto
  verificarCorte() {
    this.ingresoService.obtenerCorteAbierto().subscribe({
      next: (corte) => {
        this.corteAbierto = corte;
        this.actualizarBotones();
      },
      error: () => {
        this.corteAbierto = null;
        this.actualizarBotones();
      }
    });
  }

  // Actualizar texto y estado de botones
  actualizarBotones() {
    if (this.corteAbierto) {
      this.btnCajaTexto = 'Cerrar Caja';
      this.ingresoDisabled = false;
    } else {
      this.btnCajaTexto = 'Abrir Caja';
      this.ingresoDisabled = true;
    }
  }

  // Evento click del botón de caja
  clickCaja() {
    if (!this.corteAbierto) {
      //Mostrar modal para monto inicial
      this.modalMontoInicial.set(true);
    } else {
      // Cerrar caja automáticamente
      this.ingresoService.cerrarCorte().subscribe({
        next: () => {
          this.corteAbierto = null;
          this.actualizarBotones();
          // opcional: mostrar toast "Caja cerrada correctamente"
        },
        error: (err) => console.error(err)
      });
    }
  }

  // Modal para ingresar monto inicial
  abrirModalCaja() {
    // Usar tu modal existente para pedir monto_inicial
    const montoInicial = prompt('Ingresa monto de apertura:') || '0';
    /*this.ingresoService.abrirCorte({ monto_apertura: montoInicial }).subscribe({
      next: (corte) => {
        this.corteAbierto = corte;
        this.actualizarBotones();
        // opcional: mostrar toast "Caja abierta correctamente"
      },
      error: (err) => console.error(err)
    });*/
  }

  abrirCaja(monto: number) {
  this.ingresoService.abrirCorte({ monto_apertura: monto }).subscribe({
    next: (corte) => {
      this.corteAbierto = corte;
      this.actualizarBotones();
      this.modalMontoInicial.set(false);
      // toast: Caja abierta correctamente
    },
    error: (err) => console.error(err)
  });
}


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
