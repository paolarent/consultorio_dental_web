import { ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
import { ModalAgGasto } from "../modal-ag-gasto/modal-ag-gasto";
import { EgresoService } from '../../services/gasto-egreso.service';
import { DecimalPipe, DatePipe, CurrencyPipe } from '@angular/common';
import { IngresoService } from '../../services/ingreso.service';
import { ModalMontoInicial } from '../modal-monto-inicial/modal-monto-inicial';
import { ModalAgIngreso } from '../modal-ag-ingreso/modal-ag-ingreso';
import { ModalAgAbono } from '../modal-ag-abono/modal-ag-abono';
import { NotificationService } from '../../services/notification.service';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { AbonarIngresoDto } from '../../models/abono.model';

@Component({
  selector: 'app-finanzas',
  imports: [FormsModule, ModalAgGasto, DecimalPipe, ModalMontoInicial, ModalAgIngreso, DatePipe, MatFormFieldModule, MatSelectModule, MatOptionModule, ModalAgAbono],
  templateUrl: './finanzas.html',
  styleUrl: './finanzas.css'
})
export class Finanzas implements OnInit{
  private egresoService = inject(EgresoService);
  private notify = inject(NotificationService)
  constructor(
    private ingresoService: IngresoService,
    private cdr: ChangeDetectorRef
  ) {}

  totalGastos: number = 0;
  totalGastosMes: number = 0;
  totalIngresos: number = 0;
  totalIngresosMes: number = 0;
  gananciaMes: number = 0;
  gananciaTotal: number = 0;
  
  historial: any[] = [];
  ingresosPendientes: any[] = [];

  filtroTipo: string = 'todos';
  busqueda: string = '';
  historialFiltrado: any[] = [];
  busquedaPendientes: string = '';
  ingresosPendientesFiltrados: any[] = [];


  corteAbierto: any = null;   // guarda el corte abierto
  btnCajaTexto: string = 'Abrir Caja';
  ingresoDisabled: boolean = true;
  egresoDisabled: boolean = true;
  ingresoSeleccionado: any = null;

  //MODALES
  // Señales
  modalGastoAbierto = signal(false);
  modalMontoInicial = signal(false);
  modalAgIngreso = signal(false);
  modalAgAbono = signal(false);


  ngOnInit(): void {
    this.verificarCorte();
    this.cargarTotales();
    this.cargarHistorial();
    this.cargarPendientes();
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
      this.egresoDisabled = false;
    } else {
      this.btnCajaTexto = 'Abrir Caja';
      this.ingresoDisabled = true;
      this.egresoDisabled =  true;
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

  //CARGAS
  cargarPendientes() {
    this.ingresoService.historialIngresosPendientes().subscribe({
        next: (data) => {
            this.ingresosPendientes = data;
            this.ingresosPendientesFiltrados = [...data];
            this.cdr.detectChanges(); //FORZAR REFRESH
        },
        error: (err) => console.error('Error al cargar ingresos pendientes', err)
    });
  }

  cargarHistorial() {
    this.ingresoService.historialFinanzas().subscribe({
      next: (res) => {
        this.historial = res;
        this.aplicarFiltros();
        this.cdr.detectChanges(); //FORZAR REFRESH
      },
      error: (err) => console.error('Error al cargar historial:', err)
    });
  }

  cargarTotales() {
    // TOTAL GASTOS CONSULTORIO
    this.egresoService.totalGastos().subscribe({
      next: (res) => {
        this.totalGastos = res.total;
        this.gananciaTotal = this.totalIngresos - this.totalGastos;
        this.cdr.detectChanges(); //FORZAR REFRESH
      }
    });

    // TOTAL GASTOS MES
    this.egresoService.totalGastosMes().subscribe({
      next: res => {
        this.totalGastosMes = res.total;
        this.gananciaMes = this.totalIngresosMes - this.totalGastosMes;
        this.cdr.detectChanges(); //FORZAR REFRESH
      }
    });

    // TOTAL INGRESOS
    this.ingresoService.totalIngresos().subscribe({
      next: (res) => {
        this.totalIngresos = res.total;
        this.gananciaTotal = this.totalIngresos - this.totalGastos;
        this.cdr.detectChanges(); //FORZAR REFRESH
      }
    });

    // TOTAL INGRESOS MES
    this.ingresoService.totalIngresosMes().subscribe({
      next: res => {
        this.totalIngresosMes = res.total;
        this.gananciaMes = this.totalIngresosMes - this.totalGastosMes;
        this.cdr.detectChanges(); //FORZAR REFRESH
      }
    });
  }

  // Abrir modal
  abrirModalGasto() {
    if (!this.corteAbierto) {
      this.notify.error("Debes abrir la caja antes de registrar un gasto.");
      return;
    }
    this.modalGastoAbierto.set(true);
  }

  abrirModalIngreso() {
    if (!this.corteAbierto) {
      this.notify.error("Debes abrir la caja antes de registrar un ingreso.");
      return;
    }
    this.modalAgIngreso.set(true);
  }

  // Cerrar modal
  cerrarModalGasto() {
    this.modalGastoAbierto.set(false);
  }

  // Ejemplo de callback cuando se agrega un gasto
  actualizarHistorial(nuevoGasto: any) {
    this.cerrarModalGasto();
    this.cargarTotales();
    this.cargarHistorial();
    this.cargarPendientes();
  }


  cerrarModalIngreso() {
      this.modalAgIngreso.set(false);
  }

  crearIngreso(dto: any) {
    this.ingresoService.crearIngreso(dto).subscribe({
        next: (resp) => {
            this.notify.success("Ingreso registrado correctamente");
            this.cerrarModalIngreso();
            //refrescar datos
            this.cargarTotales();
            this.cargarHistorial();
            this.cargarPendientes();
        },
        error: (err) => {
            this.notify.error(err.error?.message ?? "Error al registrar ingreso");
        }
    });
  }

  aplicarFiltros() {
    const texto = this.busqueda.toLowerCase();

    this.historialFiltrado = this.historial.filter(item => {
      
      // FILTRO DE TIPO
      if (this.filtroTipo !== 'todos' && item.tipo !== this.filtroTipo) {
        return false;
      }

      // FILTRO DE BÚSQUEDA EN TÍTULO Y SUBTÍTULO
      const titulo = item.titulo.toLowerCase();
      const subtitulo = item.subtitulo.toLowerCase();

      if (texto && !titulo.includes(texto) && !subtitulo.includes(texto)) {
        return false;
      }

      return true;
    });
  }

  filtrarPendientes() {
    const texto = this.busquedaPendientes.trim().toLowerCase();

    if (!texto) {
      this.ingresosPendientesFiltrados = [...this.ingresosPendientes];
      return;
    }

    this.ingresosPendientesFiltrados = this.ingresosPendientes.filter(item => 
      item.paciente.toLowerCase().includes(texto) ||
      item.servicio.toLowerCase().includes(texto) ||
      String(item.monto_total).includes(texto) ||
      String(item.totalPagado).includes(texto) ||
      String(item.saldoPendiente).includes(texto)
    );
  }

  //MODAL DE ABONO INGRESO
  abrirModalAbono(ingreso: any) {
    if (!this.corteAbierto) return; // seguridad extra
    this.ingresoSeleccionado = ingreso;
    this.modalAgAbono.set(true);
  }

  // Cerrar modal
  cerrarModalAbono() {
    this.modalAgAbono.set(false);
    this.ingresoSeleccionado = null;
  }

  procesarAbono(dto: AbonarIngresoDto) {
    if (!this.ingresoSeleccionado) return;

    this.ingresoService.abonarIngreso(this.ingresoSeleccionado.id_ingreso, dto)
      .subscribe({
        next: () => {
          this.notify.success("Abono registrado correctamente");
          this.cargarPendientes();
          this.cargarHistorial();
          this.cargarTotales();
          this.cerrarModalAbono();
        },
        error: (err) => {
          this.notify.error(err.error?.message ?? "Error al registrar abono");
        }
      });
  }


}
