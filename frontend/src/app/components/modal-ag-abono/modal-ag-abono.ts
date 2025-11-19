import { AfterViewInit, Component, ElementRef, EventEmitter, inject, Input, OnChanges, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import flatpickr from 'flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es.js';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { IngresoService } from '../../services/ingreso.service';
import { NotificationService } from '../../services/notification.service';
import { DecimalPipe } from '@angular/common';
import { AbonarIngresoDto } from '../../models/abono.model';

@Component({
  selector: 'app-modal-ag-abono',
  imports: [FormsModule, MatFormFieldModule, MatSelectModule, MatOptionModule],
  templateUrl: './modal-ag-abono.html',
  styleUrl: './modal-ag-abono.css'
})
export class ModalAgAbono implements OnChanges {
  // Recibe el ingreso seleccionado desde Finanzas(padre)
  @Input() ingreso: any = null;
  // Emitimos cuando el usuario cierra el modal
  @Output() cerrar = new EventEmitter<void>();
  // Emitimos el monto del abono al guardar
  @Output() guardar = new EventEmitter<any>();

  servicioNombre: string = '';
  pacienteNombre: string = '';
  montoTotal: number = 0;
  pagado: number = 0;
  saldoPendiente: number = 0;

  ngOnChanges() {
    if (!this.ingreso) return;

    this.servicioNombre = this.ingreso.servicio;
    this.pacienteNombre = this.ingreso.paciente;
    this.montoTotal = this.ingreso.monto_total;
    this.pagado = this.ingreso.totalPagado;
    this.saldoPendiente = this.ingreso.saldoPendiente;
  }

  //INYECTAR DEPENDENCIAS
  private ingresoService = inject(IngresoService);
  private notify = inject(NotificationService);

  //METODOS DE PAGO
  metodosPago: { id_metodo_pago: number; nombre: string }[] = [];
  id_metodo_pago: number | null = null;

  dividirPago: boolean = false;
  pagosDivididos: { id_metodo_pago: number | null; monto: number | null }[] = [
    { id_metodo_pago: null, monto: null },
    { id_metodo_pago: null, monto: null }
  ];

  montoAbono: number | null = null;
  notas: string = '';
  //fecha: string = '';

  //PARA MOSTRAR MIS ERRORES
  errorMontoAbono: string = '';
  errorPagos: string = '';

  //INPUT DE FECHA
  //@ViewChild('fechaInput', { static: false }) fechaInput!: ElementRef<HTMLInputElement>;
  //private fpInstance: any;

  /*ngAfterViewInit() {
      this.initFlatpickr();
  }
  
    // ------------------- Flatpickr -------------------
    private initFlatpickr() {
      if (!this.fechaInput) return;
  
      this.fpInstance = flatpickr([this.fechaInput.nativeElement], {
        dateFormat: 'Y-m-d',
        locale: Spanish,
        allowInput: true,
        defaultDate: this.fecha || undefined,
        maxDate: new Date(),
        onChange: (selectedDates, dateStr) => {
          this.fecha = dateStr;
        }
      });
  
      this.fechaInput.nativeElement.addEventListener('input', (event: any) => {
        this.fecha = event.target.value;
      });
    }*/

    //CARGAR LOS METODOS DE PAGO
    ngOnInit() {
      this.cargarMetodosPago();
      //this.fecha = new Date().toISOString().slice(0, 10);
    }

    cargarMetodosPago() {
      this.ingresoService.listarMetodosPago().subscribe({
        next: (res) => this.metodosPago = res,
        error: () => this.notify.error('Error al cargar métodos de pago')
      });
    }

  toggleDividirPago() {
    this.dividirPago = !this.dividirPago;

    if (!this.dividirPago) {
      this.pagosDivididos = [
        { id_metodo_pago: null, monto: null },
        { id_metodo_pago: null, monto: null }
      ];
    }
  }

  agregarPago() {
    if (this.pagosDivididos.length < 4) {
      this.pagosDivididos.push({ id_metodo_pago: null, monto: null });
    }
  }

  eliminarPago(i: number) {
    if (this.pagosDivididos.length > 2) {
      this.pagosDivididos.splice(i, 1);
    }
  }

  validarPagosDivididos(): boolean {
    this.errorPagos = '';

    if (!this.dividirPago) return true;

    const suma = this.pagosDivididos.reduce((a, p) => a + Number(p.monto || 0), 0);

    if (suma !== Number(this.montoAbono)) {
      this.errorPagos = `La suma de los pagos (${suma}) no coincide con el monto (${this.montoAbono})`;
      return false;
    }

    for (const p of this.pagosDivididos) {
      if (!p.id_metodo_pago || !p.monto || p.monto <= 0) {
        this.errorPagos = 'Todos los pagos deben tener método y monto mayor a 0';
        return false;
      }
    }

    return true;
  }

  // =============================
  // GUARDAR ABONO
  // =============================
  guardarAbono() {
    this.errorMontoAbono = '';

    if (!this.montoAbono || this.montoAbono <= 0) {
      this.errorMontoAbono = 'Ingrese un monto válido.';
      return;
    }

    if (this.montoAbono > this.ingreso.saldoPendiente) {
      this.errorMontoAbono = 'El abono excede el saldo pendiente.';
      return;
    }

    /*if (!this.fecha) {
      this.notify.warning('Debe seleccionar una fecha.');
      return;
    }*/

    if (this.dividirPago && !this.validarPagosDivididos()) return;
    if (!this.dividirPago && !this.id_metodo_pago) {
      this.notify.warning('Seleccione un método de pago');
      return;
    }

    // OBJETO COMPLETO PARA ENVIAR A BD
    const dto: AbonarIngresoDto = {
      monto: this.montoAbono,
      id_metodo_pago: this.dividirPago ? undefined : this.id_metodo_pago!,
      referencia: this.notas || undefined,
      pagosDivididos: this.dividirPago
        ? this.pagosDivididos.map(p => ({
            id_metodo_pago: p.id_metodo_pago!,
            monto: p.monto!
          }))
        : undefined
    };

    this.guardar.emit(dto);
  }

  validarMonto() {
    if (this.montoAbono === null || this.montoAbono === undefined) {
        this.errorMontoAbono = '';
        return;
    }

    if (this.montoAbono < 1) {
        this.errorMontoAbono = 'El monto debe ser mínimo 1.';
        return;
    }

    if (this.montoAbono > this.saldoPendiente) {
        this.errorMontoAbono = `No puede abonar más de lo pendiente ($${this.saldoPendiente})`;
        return;
    }

    this.errorMontoAbono = ''; // Todo OK
  }

  cancelar() {
    this.cerrar.emit();
  }

}
