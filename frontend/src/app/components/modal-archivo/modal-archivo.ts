import { Component, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { Archivo } from '../../models/archivo.model';
import { ArchivoService } from '../../services/archivo.service';
import { StatusArchivo } from '../../../../../backend/src/common/enums';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-modal-archivo',
  imports: [FormsModule],
  templateUrl: './modal-archivo.html',
  styleUrl: './modal-archivo.css'
})
export class ModalArchivo {
  private notify = inject(NotificationService);

  @Input() paciente!: { id_paciente: number };
  @Output() archivoAgregado = new EventEmitter<Archivo>();
  @Output() cerrar = new EventEmitter<void>();

  @Input() archivoEditar: Archivo | null = null;  // si viene algo significa modo editar
  @Output() archivoActualizado = new EventEmitter<Archivo>();
  tieneImagenOriginal = signal(false);

  nombre = signal('');
  descripcion = signal('');
  file = signal<File | null>(null);
  preview = signal<string | null>(null);

  cargando = signal(false);

  constructor(private archivoService: ArchivoService) {}

  ngOnChanges() {
    if (this.archivoEditar) {
      this.nombre.set(this.archivoEditar.nombre);
      this.descripcion.set(this.archivoEditar.descripcion);
      this.preview.set(this.archivoEditar.url_imagen);

      this.file.set(null); // no hay archivo nuevo
      this.tieneImagenOriginal.set(true);  // sí existe imagen previa
    } else {
      this.nombre.set('');
      this.descripcion.set('');
      this.preview.set(null);

      this.file.set(null);
      this.tieneImagenOriginal.set(false);
    }
  }


  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.file.set(input.files[0]);
      const reader = new FileReader();
      reader.onload = () => {
        this.preview.set(reader.result as string);
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  cancelar() {
    this.cerrar.emit();
  }

  guardar() {
    if (!this.archivoEditar) {
      if (!this.nombre() || !this.descripcion() || !this.file()) {
        this.notify.warning('Por favor complete todos los campos');
        return;
      }
    }

    if (this.archivoEditar) {
      if (!this.nombre().trim() || !this.descripcion().trim()) {
        this.notify.warning('Por favor complete todos los campos');
        this.cargando.set(false);
        return;
      }
    }


    this.cargando.set(true);

    const formData = new FormData();
    formData.append('nombre', this.nombre());
    formData.append('descripcion', this.descripcion());

    // Si hay archivo nuevo, adjuntarlo
    if (this.file()) {
      formData.append('file', this.file()!);
    }

    // --- MODO EDITAR ---
    if (this.archivoEditar) {
      // Si NO hay archivo nuevo y NO tiene imagen actual (caso imposible pero válido)
      if (!this.file() && !this.tieneImagenOriginal()) {
        this.notify.warning('Debe seleccionar una imagen');
        this.cargando.set(false);
        return;
      }

      this.archivoService.actualizarArchivo(
        this.archivoEditar.id_archivo,
        formData
      ).subscribe({
        next: (archivo) => {
          this.archivoActualizado.emit(archivo);
          this.notify.success('Archivo actualizado');
          this.cargando.set(false);
        },
        error: () => {
          this.notify.error('Error al actualizar');
          this.cargando.set(false);
        }
      });

      return;
    }

    // --- MODO CREAR ---
    if (!this.file()) {
      this.notify.warning('Debe subir una imagen');
      this.cargando.set(false);
      return;
    }

    //formData.append('file', this.file()!);

    this.archivoService.subirArchivo(
      this.paciente.id_paciente,
      formData
    ).subscribe({
      next: (archivo) => {
        this.archivoAgregado.emit(archivo);
        this.notify.success('Archivo agregado');
        this.cargando.set(false);
      },
      error: () => {
        this.notify.error('Error al agregar');
        this.cargando.set(false);
      }
    });
  }


}
