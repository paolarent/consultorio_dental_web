import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, inject, Output, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import flatpickr from 'flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es.js';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { IngresoService } from '../../services/ingreso.service';
import { ServicioService } from '../../services/servicio.service';
import { PacienteService } from '../../services/paciente.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-modal-ag-ingreso',
  imports: [FormsModule, MatFormFieldModule, MatSelectModule, MatOptionModule],
  templateUrl: './modal-ag-ingreso.html',
  styleUrl: './modal-ag-ingreso.css'
})
export class ModalAgIngreso implements AfterViewInit {
  @Output() cerrar = new EventEmitter<void>();
  @Output() crear = new EventEmitter<any>();

  private ingresoService = inject(IngresoService);
  private servicioService = inject(ServicioService);
  private pacienteService = inject(PacienteService);
  private notify = inject(NotificationService);
  private elementRef = inject(ElementRef);

  cargando = signal(false);

  @ViewChild('fechaInput', { static: false }) fechaInput!: ElementRef<HTMLInputElement>;

  tiposServicio: { id_servicio: number; nombre: string; precio_base: number; tipo_cobro?: string }[] = [];
  
  metodosPago: { id_metodo_pago: number; nombre: string }[] = [];

  dividirPago: boolean = false;
  pagosDivididos: { id_metodo_pago: number | null; monto: number | null }[] = [
    { id_metodo_pago: null, monto: null },
    { id_metodo_pago: null, monto: null }
  ];

  id_metodo_pago: number | null = null;
  id_servicio: number | null = null;
  servicioSeleccionado: any = null;
  cantidad: number | null = null;

  monto: string = '';
  fecha: string = '';
  notas: string = '';

  tipoPago: 'total' | 'parcial' | null = null;
  montoAbono: number | null = null;

  // Errores para mostrar en tiempo real
  errorMontoAbono: string = '';
  errorPagosDivididos: string = '';

  private fpInstance: any;

  ngOnInit(): void {
    this.cargarServicios();
    this.cargarMetodosPago();
  }

  ngAfterViewInit() {
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
  }

  cargarServicios() {
    this.servicioService.listarServicios().subscribe({
      next: (res) => this.tiposServicio = res,
      error: (err) => console.error("Error al cargar servicios", err)
    });
  }

  onServicioChange(id: number) {
    this.servicioSeleccionado = this.tiposServicio.find(s => s.id_servicio === id) ?? null;
    this.calcularMonto();
  }

  seleccionarServicio(servicio: any) {
    this.id_servicio = servicio.id_servicio;
    this.servicioSeleccionado = servicio;

    if (servicio.tipo_cobro !== 'unidad_anatomica') {
      this.cantidad = null;
    }

    this.calcularMonto();
  }

  // ---------------- PACIENTES ----------------
  pacientesFiltrados: any[] = [];
  busquedaPaciente: string = '';
  id_paciente: number | null = null;
  mostrarLista = false;

  buscarPaciente() {
    if (this.busquedaPaciente.trim().length < 2) {
      this.pacientesFiltrados = [];
      this.mostrarLista = false;
      return;
    }

    this.pacienteService.buscarPacientes(this.busquedaPaciente).subscribe({
      next: (res) => {
        this.pacientesFiltrados = res;
        this.mostrarLista = true;
      },
      error: (err) => console.error("Error al buscar paciente", err)
    });
  }

  seleccionarPaciente(pac: any) {
    this.id_paciente = pac.id_paciente;
    this.busquedaPaciente = `${pac.nombre} ${pac.apellido1} ${pac.apellido2 ?? ''}`.trim();
    this.mostrarLista = false;
    this.pacientesFiltrados = [];
  }

  @HostListener('document:click', ['$event'])
  clickFuera(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.mostrarLista = false;
    }
  }

  cargarMetodosPago() {
    this.ingresoService.listarMetodosPago().subscribe({
      next: (res) => this.metodosPago = res,
      error: (err) => console.error("Error al cargar métodos de pago", err)
    });
  }


  calcularMonto() {
  if (!this.servicioSeleccionado) {
    this.monto = '';
    return;
  }

  const precio = Number(this.servicioSeleccionado?.precio_base || 0);

  if (this.servicioSeleccionado.tipo_cobro === 'unidad_anatomica') {
    const cantidad = Number(this.cantidad || 1);
    this.monto = (precio * cantidad).toFixed(2);
  } else {
    // Para servicios tipo plan_terapeutico solo se toma el precio_base
    this.monto = precio.toFixed(2);
  }
}


  //-----------------------DIVIDIR PAGO---------------------
  toggleDividirPago() {
    this.dividirPago = !this.dividirPago;
    if (this.dividirPago) {
      this.pagosDivididos = [
        { id_metodo_pago: null, monto: null },
        { id_metodo_pago: null, monto: null }
      ];
    } else {
      this.id_metodo_pago = null;
      //this.monto = '';
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

  eliminarPago(index: number) {
    if (this.pagosDivididos.length > 2) {
      this.pagosDivididos.splice(index, 1);
    }
  }

  // ---------------- Validaciones en tiempo real ----------------
  validarAbonoParcial(): boolean {
    this.errorMontoAbono = '';

    if (this.tipoPago === 'parcial') {
      if (!this.montoAbono || this.montoAbono <= 0) {
        this.errorMontoAbono = 'Ingresa un monto de abono válido';
        return false;
      }
      if (this.montoAbono >= Number(this.monto)) {
        this.errorMontoAbono = 'El abono no puede ser mayor o igual al monto total';
        return false;
      }
    }

    return true;
  }

  validarPagosDivididos(): boolean {
    this.errorPagosDivididos = '';

    if (this.dividirPago) {
      const sumaPagos = this.pagosDivididos.reduce((acc, p) => acc + Number(p.monto || 0), 0);
      const montoComparar = this.tipoPago === 'parcial' ? Number(this.montoAbono) : Number(this.monto);

      if (sumaPagos !== montoComparar) {
        this.errorPagosDivididos = `La suma de los pagos (${sumaPagos}) no coincide con el monto ${montoComparar}`;
        return false;
      }

      for (const p of this.pagosDivididos) {
        if (!p.id_metodo_pago || !p.monto || p.monto <= 0) {
          this.errorPagosDivididos = 'Cada pago debe tener un método y monto mayor a cero';
          return false;
        }
      }
    }

    return true;
  }

  // ---------------- Enviar DTO ----------------
  validarYCrearIngreso() {
    if (this.cargando()) return; // Evita clicks múltiples
    
    if (!this.validarAbonoParcial() || !this.validarPagosDivididos()) return;

    const dto: any = {
      id_paciente: this.id_paciente,
      notas: this.notas,
      detalles: [
        {
          id_servicio: this.id_servicio,
          cantidad: this.cantidad || 1,
          precio_unitario: Number(this.servicioSeleccionado?.precio_base || 0),
          subtotal: Number(this.monto),
        }
      ],
      pagos: this.dividirPago
        ? this.pagosDivididos.map(p => ({ id_metodo_pago: p.id_metodo_pago, monto: Number(p.monto) || 0 }))
        : [
            {
              id_metodo_pago: this.id_metodo_pago!,
              //monto: this.tipoPago === 'parcial' ? this.montoAbono : Number(this.monto)
              monto: Number(this.tipoPago === 'parcial' ? this.montoAbono : this.monto) || 0
            }
          ]
    };

    this.cargando.set(true); //Activa bloqueo antes de enviar

    this.ingresoService.crearIngreso(dto).subscribe({
      next: res => {
        this.notify.success('Ingreso agregado correctamente');
        this.cancelar();
        this.cargando.set(false); // desbloquear
      },
      error: err => {
        console.error(err);
        this.notify.error('Ocurrió un error al crear el ingreso');
        this.cargando.set(false); // desbloquear
      }
    });
  }

  cancelar(): void {
    this.cerrar.emit();
  }
}
