import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { TipoCobro } from '../../../../../backend/src/common/enums';
import { ServicioService } from '../../services/servicio.service';
import { NotificationService } from '../../services/notification.service';

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
  file: File | null = null; // <-- Archivo seleccionado

  private servicioService = inject(ServicioService);
  private notify = inject(NotificationService);

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.file = input.files[0]; // <-- Guardar archivo real
      const reader = new FileReader();
      reader.onload = () => this.preview.set(reader.result as string);
      reader.readAsDataURL(this.file);
    }
  }

  agregarServicio() {
    // Validación de campos
    if (!this.nombre() || !this.descripcion() || !this.tipoCobro() || 
        !this.precio() || !this.duracion() || !this.file) {
      this.notify.warning('Por favor completa todos los campos antes de continuar.');
      return; // Salimos para que no haga la petición dioquis
    }

    const formData = new FormData();
    formData.append('nombre', this.nombre());
    formData.append('descripcion', this.descripcion());
    formData.append('tipo_cobro', this.tipoCobro()!);
    formData.append('precio_base', this.precio()?.toString()!);
    formData.append('duracion_base', this.duracion()?.toString()!);
    formData.append('imagen', this.file); // <-- archivo real

    this.servicioService.createServicio(formData).subscribe({
      next: (res) => {
        this.notify.success('Servicio agregado correctamente.');
        //console.log('Servicio creado', res);
        this.limpiar();
        this.cerrar.emit();
      },
      error: (err) => {
        this.notify.error(err?.error?.message || 'Error. No se pudo agregar el servicio.');
        console.error(err);
      }
    });
  }

  limpiar() {
    this.nombre.set('');
    this.descripcion.set('');
    this.precio.set(null);
    this.duracion.set(null);
    this.tipoCobro.set(null);
    this.preview.set(null);
    this.file = null;
  }
}