import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { TipoCobro } from '../../../../../backend/src/common/enums';
import { ServicioService } from '../../services/servicio.service';
import { NotificationService } from '../../services/notification.service';
import { Servicio } from '../../models/servicio';

@Component({
  selector: 'app-modal-ag-servicio',
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatSelectModule, MatOptionModule],
  templateUrl: './modal-ag-servicio.html',
  styleUrl: './modal-ag-servicio.css'
})
export class ModalAgServicio {
  @Output() cerrar = new EventEmitter<void>();

  TipoCobro = TipoCobro;

  preview = signal<string | null>(null);
  nombre = signal('');
  descripcion = signal('');
  precio = signal<number | null>(null);
  duracion = signal<number | null>(null);
  tipoCobro = signal<TipoCobro | null>(null);
  file: File | null = null;

  private servicioService = inject(ServicioService);
  private notify = inject(NotificationService);

  private _servicioEditar: Servicio | null = null;

  @Input() set servicioEditar(servicio: Servicio | null) {
    this._servicioEditar = servicio;
    if (servicio) {
      this.nombre.set(servicio.nombre);
      this.descripcion.set(servicio.descripcion);
      this.tipoCobro.set(servicio.tipo_cobro);
      this.precio.set(servicio.precio_base);
      this.duracion.set(servicio.duracion_base);
      this.preview.set(servicio.url_imagen || null);
      this.file = null; // si quiere cambiar la imagen, seleccionará un archivo
    } else {
      this.limpiar();
    }
  }

  get servicioEditar() {
    return this._servicioEditar;
  }

  get esEdicion(): boolean {
    return !!this.servicioEditar;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => this.preview.set(reader.result as string);
      reader.readAsDataURL(this.file);
    }
  }

  guardarServicio() {
    // Validación: el archivo solo obligatorio si es creación
    if (!this.nombre() || !this.descripcion() || !this.tipoCobro() || 
        !this.precio() || !this.duracion() || (!this.file && !this.esEdicion)) { 
      this.notify.warning('Por favor completa todos los campos antes de continuar.');
      return;
    }

    const formData = new FormData();
    formData.append('nombre', this.nombre());
    formData.append('descripcion', this.descripcion());
    formData.append('tipo_cobro', this.tipoCobro()!);
    formData.append('precio_base', this.precio()?.toString()!);
    formData.append('duracion_base', this.duracion()?.toString()!);

    if (this.file) formData.append('imagen', this.file);

    if (this.esEdicion) {
      this.servicioService.updateServicio(this.servicioEditar!.id_servicio!, formData).subscribe({
        next: () => {
          this.notify.success('Servicio actualizado correctamente.');
          this.cerrar.emit();
        },
        error: (err) => this.notify.error(err?.error?.message || 'Error al actualizar servicio.')
      });
    } else {
      this.servicioService.createServicio(formData).subscribe({
        next: () => {
          this.notify.success('Servicio agregado correctamente.');
          this.limpiar();
          this.cerrar.emit();
        },
        error: (err) => this.notify.error(err?.error?.message || 'Error. No se pudo agregar el servicio.')
      });
    }
  }

  limpiar() {
    this.nombre.set('');
    this.descripcion.set('');
    this.precio.set(null);
    this.duracion.set(null);
    this.tipoCobro.set(null);
    this.preview.set(null);
    this.file = null;
    this._servicioEditar = null;
  }
}