import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, inject, Input, OnInit, Output, Signal, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import flatpickr from 'flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es.js';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { NgxMaterialTimepickerComponent, NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { ServicioService } from '../../services/servicio.service';
import { PacienteService } from '../../services/paciente.service';
import { NotificationService } from '../../services/notification.service';
import { FrecuenciaServicio } from '../../shared/enums';
import { CitaService } from '../../services/cita.service';

@Component({
  selector: 'app-modal-create-cita',
  imports: [FormsModule, MatFormFieldModule, MatSelectModule, MatOptionModule, NgxMaterialTimepickerModule],
  templateUrl: './modal-create-cita.html',
  styleUrl: './modal-create-cita.css'
})
export class ModalCreateCita implements OnInit, AfterViewInit {
  @Output() cerrar = new EventEmitter<void>();
  @Output() crear = new EventEmitter<any>();

  @Input() fechaInicial: string = '';
  @Input() horaInicial: string = '';

  private servicioService = inject(ServicioService);
  private pacienteService = inject(PacienteService);
  private citaService = inject(CitaService);
  private notify = inject(NotificationService);
  private elementRef = inject(ElementRef);

  cargando = signal(false);

  @ViewChild('fechaInput', { static: false }) fechaInput!: ElementRef<HTMLInputElement>;
  @ViewChild('tpInicio', { static: false }) tpInicio!: NgxMaterialTimepickerComponent;

  tiposServicio: { id_servicio: number; nombre: string; precio_base: number; tipo_cobro?: string }[] = [];
  frecuencia: FrecuenciaServicio | null = null;

  frecuencias = Object.values(FrecuenciaServicio).map(value => ({
    id: value,   //valor del enum
    nombre: value
  }));


  id_servicio: number | null = null;
  servicioSeleccionado: any = null;
  fecha: string = '';
  hora_inicio: string = '';
  notas: string = '';

  private fpInstance: any;

  ngOnInit(): void {
    this.fecha = this.fechaInicial || '';
    this.hora_inicio = this.horaInicial || '';
    this.cargarServicios();
  }
  
  ngAfterViewInit() {
    this.initFlatpickr();

    if (this.horaInicial) {
      setTimeout(() => {
        this.hora_inicio = this.horaInicial; // Asignamos al ngModel
        //this.tpInicio.open(); // Opcional, si quieres abrir el picker
      });
    }
  }

  cargarServicios() {
    this.servicioService.listarServicios().subscribe({
      next: (res) => this.tiposServicio = res,
      error: (err) => console.error("Error al cargar servicios", err)
    });
  }

  // ------------------- Flatpickr -------------------
  private initFlatpickr() {
    if (!this.fechaInput) return;

    this.fpInstance = flatpickr([this.fechaInput.nativeElement], {
      dateFormat: 'Y-m-d',
      locale: Spanish,
      allowInput: true,
      defaultDate: this.fecha || undefined,
      minDate: new Date(),
      onChange: (selectedDates, dateStr) => {
        this.fecha = dateStr;
      }
    });

    this.fechaInput.nativeElement.addEventListener('input', (event: any) => {
      this.fecha = event.target.value;
    });
  }

  //-----------------PACIENTES--------------------
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

  crearCita() {
    if (this.cargando()) return; // bloqueamos si ya está en proceso

    if (!this.id_paciente) {
      this.notify.error('Debes seleccionar un paciente');
      return;
    }

    if (!this.id_servicio) {
      this.notify.error('Debes seleccionar un servicio');
      return;
    }

    if (!this.fecha || !this.hora_inicio) {
      this.notify.error('Debes seleccionar fecha y hora');
      return;
    }

    if (!this.frecuencia) {
      this.notify.error('Debes seleccionar alguna frecuencia, usa unica por defecto');
      return;
    }

    this.cargando.set(true);

    const dto = {
      id_paciente: this.id_paciente,
      id_servicio: this.id_servicio,
      fecha: this.fecha,
      hora_inicio: this.hora_inicio,
      frecuencia: this.frecuencia || FrecuenciaServicio.UNICA,
      notas: this.notas
    };

    this.citaService.crearCita(dto).subscribe({
      next: (res) => {
        this.notify.success(res.mensaje || 'Cita creada');
        this.crear.emit(res.cita); // Emitir para que el calendario pueda actualizarse
        this.cerrar.emit();        // Cerrar modal
      },
      error: (err) => {
        console.error('Error al crear cita', err);
        this.notify.error(err.error?.message || 'Error al crear la cita');
        this.cargando.set(false); 
      },
      complete: () => this.cargando.set(false)
    });
  }

  cancelar(): void {
    this.cerrar.emit();
  }

}
