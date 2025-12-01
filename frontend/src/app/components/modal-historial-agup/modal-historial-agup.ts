import { AfterViewInit, Component, ElementRef, EventEmitter, inject, Input, Output, signal, ViewChild } from '@angular/core';
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
  @Input() historial?: Historial; // si viene, vamos a editar

  guardando = signal(false);  //Signal para evitar sobrepresionar

  tiposServicio: any[] = [];
  id_servicio!: number;
  fecha: string = '';
  notas: string = '';
  archivos: ArchivoPreview[] = [];
  private fpInstance: any;

  private historialService = inject(HistorialService);
  private servicioService = inject(ServicioService);
  private notify = inject(NotificationService);

  @ViewChild('fechaInput', { static: false }) fechaInput!: ElementRef<HTMLInputElement>;

  ngAfterViewInit() {
    this.initFlatpickr();
    this.cargarServicios();

    if (this.historial) {
        this.cargarDatosParaEdicion();
    }
  }

  private cargarDatosParaEdicion() {
    if (!this.historial) return;

    // Posponer la asignación de propiedades para evitar ExpressionChangedAfterItHasBeenCheckedError
    Promise.resolve().then(() => {
      this.id_servicio = this.historial!.id_servicio ?? 0;
      this.fecha = this.historial!.fecha || '';
      this.notas = this.historial!.descripcion || '';
      this.archivos = (this.historial!.fotografia_historial || []).map(f => ({
        file: null as any,
        preview: f.url_fotografia,
        id_foto: f.id_foto
      }));

      // Actualizar flatpickr si ya se inicializó
      if (this.fpInstance && this.fecha) {
        this.fpInstance.setDate(this.fecha, false);
      }
    });
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

    archivosSeleccionados.forEach((f) => {
      const reader = new FileReader();
      reader.onload = () => {
        this.archivos.push({ file: f, preview: reader.result as string, index: this.archivos.length });
      };
      reader.readAsDataURL(f);
    });


    // Limpiar input para permitir nueva selección
    input.value = '';
  }


  eliminarArchivo(index?: number, id_foto?: number) {
      if (id_foto) {
          // llamar API para eliminar foto existente
          this.historialService.eliminarFoto(id_foto).subscribe({
              next: () => {
                  this.archivos = this.archivos.filter(a => a.id_foto !== id_foto);
                  this.notify.success('Foto eliminada correctamente.');
              },
              error: () => this.notify.error('Error al eliminar foto')
          });
      } else if (index !== undefined) {
          // eliminar foto nueva
          this.archivos.splice(index, 1);
      }
  }

  cargarServicios() {
    this.servicioService.listarServicios().subscribe({
      next: res => this.tiposServicio = res,
      error: err => console.error("Error al cargar servicios", err)
    });
  }

  guardarTratamiento() {
      if (this.guardando()) return; // prevenir clicks múltiples

      if (!this.id_servicio || !this.fecha || !this.notas || this.archivos.length === 0) {
          this.notify.warning('Por favor, completa todos los campos obligatorios');
          return;
      }

      const formData = new FormData();
      formData.append('id_paciente', String(this.paciente.id_paciente));
      formData.append('id_servicio', String(this.id_servicio));
      formData.append('fecha', this.fecha);
      formData.append('descripcion', this.notas);

      this.archivos.filter(a => a.file).forEach(a => formData.append('fotos', a.file!));

      this.guardando.set(true); // bloquear mientras se procesa

      const callback = {
        next: (res: any) => { 
          this.agregado.emit(res); 
          this.notify.success(this.historial ? 'Tratamiento actualizado' : 'Tratamiento registrado'); 
          this.cerrar.emit(); 
        },
        error: (err: any) => { 
          console.error(err); 
          this.notify.error(this.historial ? 'Error al actualizar tratamiento' : 'Error al registrar tratamiento'); 
          this.guardando.set(false); 
        },
        complete: () => { 
          this.guardando.set(false); 
        }
      };

      if (this.historial) {
          this.historialService.actualizarTratamiento(this.historial.id_historial, formData).subscribe(callback);
      } else {
          this.historialService.registrarTratamiento(formData).subscribe(callback);
      }
  }

}
