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

  nombre = signal('');
  descripcion = signal('');
  file = signal<File | null>(null);
  preview = signal<string | null>(null);

  cargando = signal(false);

  constructor(private archivoService: ArchivoService) {}

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
    if (!this.nombre() || !this.file() || !this.descripcion()) {
      this.notify.warning('Por favor complete todos los campos');
      return;
    } 

    this.cargando.set(true);
    const formData = new FormData();
    formData.append('nombre', this.nombre());
    formData.append('descripcion', this.descripcion());
    formData.append('status', StatusArchivo.ACTIVO);
    formData.append('imagen', this.file()!);

    this.archivoService.subirArchivo(this.paciente.id_paciente, formData).subscribe({
      next: (archivo: Archivo) => {
        this.archivoAgregado.emit(archivo);
        this.notify.success('Archivo agregado correctamente');
        this.cargando.set(false);
      },
      error: (err) => {
        console.error(err);
        this.notify.error('Error, no se pudo agregar el archivo');
        this.cargando.set(false);
      }
    });
  }
}
