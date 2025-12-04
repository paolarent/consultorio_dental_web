import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { TipoCobro } from '../../shared/enums';
import { ServicioService } from '../../services/servicio.service';
import { NotificationService } from '../../services/notification.service';
import { Servicio } from '../../models/servicio';
import { IAService } from '../../services/ia.service';

@Component({
  selector: 'app-modal-ag-servicio',
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatSelectModule, MatOptionModule],
  templateUrl: './modal-ag-servicio.html',
  styleUrl: './modal-ag-servicio.css'
})
export class ModalAgServicio {
  @Output() cerrar = new EventEmitter<void>();

  TipoCobro = TipoCobro;
  guardando = signal(false);

  preview = signal<string | null>(null);
  nombre = signal('');
  descripcion = signal('');
  precio = signal<number | null>(null);
  duracion = signal<number | null>(null);
  tipoCobro = signal<TipoCobro | null>(null);
  file: File | null = null;

  //IA
  motivosIA = signal<string[]>([]);
  motivosSeleccionados = signal<string[]>([]);
  cargandoIA = signal(false);

  private servicioService = inject(ServicioService);
  private iaService = inject(IAService);
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
    if (this.guardando()) return; // si ya estamos guardando, ignoramos clics adicionales

    // Validación: el archivo solo obligatorio si es creación
    if (!this.nombre() || !this.descripcion() || !this.tipoCobro() || 
        !this.precio() || !this.duracion() || (!this.file && !this.esEdicion)) { 
      this.notify.warning('Por favor completa todos los campos antes de continuar.');
      return;
    }

    //Validación de precio y durecion
    if (this.precio()! < 0) {
      this.notify.warning('Cuidado!, el precio no puede ser negativo.');
      return;
    }

    if (this.duracion()! < 0) {
      this.notify.warning('Cuidado!, la duración no puede ser negativa.');
      return;
    }

    // Validar que haya al menos 1 motivo
    if (this.motivosSeleccionados().length === 0) {
      this.notify.warning('Debes seleccionar al menos 1 motivo de consulta asociado');
      return;
    }

     // Bloqueamos el botón
    this.guardando.set(true);

    const formData = new FormData();
    formData.append('nombre', this.nombre());
    formData.append('descripcion', this.descripcion());
    formData.append('tipo_cobro', this.tipoCobro()!);
    formData.append('precio_base', this.precio()?.toString()!);
    formData.append('duracion_base', this.duracion()?.toString()!);
    // enviar motivos seleccionados al backend
    formData.append('motivos', JSON.stringify(this.motivosSeleccionados()));

    if (this.file) formData.append('imagen', this.file);

    const observable = this.esEdicion
    ? this.servicioService.updateServicio(this.servicioEditar!.id_servicio!, formData)
    : this.servicioService.createServicio(formData);

    observable.subscribe({
      next: () => {
        this.notify.success(this.esEdicion ? 'Servicio actualizado correctamente.' : 'Servicio agregado correctamente.');
        this.limpiar();
        this.cerrar.emit();
        this.guardando.set(false); // desbloqueamos
      },
      error: (err) => {
        this.notify.error(err?.error?.message || 'Ocurrió un error.');
        this.guardando.set(false); // desbloqueamos
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
    this._servicioEditar = null;
  }

  toggleMotivo(motivo: string) {
    const seleccionados = this.motivosSeleccionados();

    // ya estaba → quitarlo
    if (seleccionados.includes(motivo)) {
      this.motivosSeleccionados.set(
        seleccionados.filter(m => m !== motivo)
      );
      return;
    }

    // máximo 3
    if (seleccionados.length >= 3) {
      this.notify.warning("Solo puedes seleccionar hasta 3 motivos.");
      return;
    }

    // agregar
    this.motivosSeleccionados.set([...seleccionados, motivo]);
  }

  usarMotivosSeleccionados() {
    const seleccionados = this.motivosSeleccionados();
    if (seleccionados.length === 0) {
      this.notify.warning("Selecciona al menos un motivo.");
      return;
    }

    this.descripcion.set(seleccionados.join(', '));
  }

  generarMotivosIA() {
    if (!this.nombre()) {
      this.notify.warning("Primero escribe el nombre del servicio.");
      return;
    }
    if (!this.descripcion()) {
      this.notify.warning("La descripción es obligatoria para generar los motivos.");
      return;
    }

    this.cargandoIA.set(true);

    this.iaService.generarMotivos({
      nombre: this.nombre(),
      descripcion: this.descripcion(),
      n: 5
    }).subscribe({
      next: (res) => {
        this.motivosIA.set(Array.isArray(res) ? res : []);
        this.motivosSeleccionados.set([]);
        this.cargandoIA.set(false);
      },
      error: () => {
        this.notify.error("Ocurrió un error generando motivos.");
        this.cargandoIA.set(false);
      }
    });
  }

}