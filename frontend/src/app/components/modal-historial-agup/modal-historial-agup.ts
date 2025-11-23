import { AfterViewInit, Component, ElementRef, EventEmitter, inject, Input, Output, ViewChild } from '@angular/core';
import flatpickr from 'flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es.js';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { ServicioService } from '../../services/servicio.service';
import { HistorialService } from '../../services/historial.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-modal-historial-agup',
  imports: [FormsModule, MatFormFieldModule, MatSelectModule, MatOptionModule],
  templateUrl: './modal-historial-agup.html',
  styleUrl: './modal-historial-agup.css'
})
export class ModalHistorialAgup implements AfterViewInit {
  @Input() paciente!: { id_paciente: number };
  @Output() cerrar = new EventEmitter<void>();
  @Output() agregado = new EventEmitter<any>();

  tiposServicio: any[] = [];
  id_servicio!: number;
  fecha: string = '';
  notas: string = '';
  archivos: ArchivoPreview[] = [];
  private fpInstance: any;
  previewUrl: string | null = null;

  private historialService = inject(HistorialService);
  private servicioService = inject(ServicioService);
  private notify = inject(NotificationService);

  @ViewChild('fechaInput', { static: false }) fechaInput!: ElementRef<HTMLInputElement>;

  ngAfterViewInit() {
    this.initFlatpickr();
    this.cargarServicios();
  }

  private initFlatpickr() {
    if (!this.fechaInput) return;
    this.fpInstance = flatpickr([this.fechaInput.nativeElement], {
      dateFormat: 'Y-m-d',
      locale: Spanish,
      allowInput: true,
      defaultDate: this.fecha || undefined,
      maxDate: new Date(),
      onChange: (_, dateStr) => this.fecha = dateStr
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const archivosSeleccionados = Array.from(input.files);

    // Limitar a máximo 3
    const totalArchivos = this.archivos.length + archivosSeleccionados.length;
    if (totalArchivos > 3) {
      this.notify.warning('Solo puedes subir máximo 3 imágenes');
      return;
    }

    archivosSeleccionados.forEach((f, idx) => {
      const reader = new FileReader();
      reader.onload = () => {
        this.archivos.push({ file: f, preview: reader.result as string, index: this.archivos.length });
      };
      reader.readAsDataURL(f);
    });


    // Limpiar input para permitir nueva selección
    input.value = '';
  }


  eliminarArchivo(index: number) {
    this.archivos.splice(index, 1);
  }


  cargarServicios() {
    this.servicioService.listarServicios().subscribe({
      next: res => this.tiposServicio = res,
      error: err => console.error("Error al cargar servicios", err)
    });
  }

  registrarTratamiento() {
    if (!this.id_servicio || !this.fecha || !this.notas || this.archivos.length === 0) {
      this.notify.warning('Por favor, Completa todos los campos obligatorios');
      return;
    }

    const formData = new FormData();
    formData.append('id_paciente', String(this.paciente.id_paciente));
    formData.append('id_servicio', String(this.id_servicio));
    formData.append('fecha', this.fecha);
    formData.append('descripcion', this.notas);
    this.archivos.forEach(a => formData.append('fotos', a.file));

    this.historialService.registrarTratamiento(formData).subscribe({
      next: res => {
        this.agregado.emit(res);
        this.notify.success('Tratamiento registrado correctamente.')
        this.cerrar.emit();
      },
      error: err => {
        console.error('Error al registrar historial', err);
        this.notify.error('Error al registrar tratamiento');
      }
    });
  }
}
