import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, inject, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import flatpickr from 'flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es.js';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { IngresoService } from '../../services/ingreso.service';
import { ServicioService } from '../../services/servicio.service';
import { PacienteService } from '../../services/paciente.service';

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
  private elementRef = inject(ElementRef);

  @ViewChild('fechaInput', { static: false }) fechaInput!: ElementRef<HTMLInputElement>;

  tiposServicio: { id_servicio: number; nombre: string }[] = [];

  id_servicio: number | null = null;
  servicioSeleccionado: any = null;
  cantidad: number | null = null;

  monto: string = '';
  fecha: string = '';
  notas: string = '';

  tipoPago: 'total' | 'parcial' | null = null;
  montoAbono: number | null = null;


  private fpInstance: any;

  ngOnInit(): void {
    this.cargarServicios();
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
      defaultDate: this.fecha || undefined, // en lugar de null
      maxDate: new Date(),
      onChange: (selectedDates, dateStr) => {
        this.fecha = dateStr;
      }
    });

    // Detecta si el usuario borra manualmente la fecha
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
  }

  seleccionarServicio(servicio: any) {
    this.id_servicio = servicio.id_servicio;
    this.servicioSeleccionado = servicio;

    // Reiniciar cantidad si cambiamos de servicio
    if (servicio.tipo_cobro !== 'unidad_anatomica') {
      this.cantidad = null;
    }
  }

  // ---------------- PACIENTES ----------------
  pacientesFiltrados: any[] = [];
  busquedaPaciente: string = '';
  id_paciente: number | null = null;
  mostrarLista = false;

  // Llamar mientras escribe
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

    // Construir nombre completo
    this.busquedaPaciente = `${pac.nombre} ${pac.apellido1} ${pac.apellido2 ?? ''}`.trim();

    this.mostrarLista = false;
    this.pacientesFiltrados = []; // cerrar dropdown
  }

  // Cerrar dropdown al hacer clic fuera
  @HostListener('document:click', ['$event'])
  clickFuera(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.mostrarLista = false;
    }
  }

  cancelar(): void {
    this.cerrar.emit();
  }

}
