import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { ArchivoService } from '../../services/archivo.service';
import { Archivo } from '../../models/archivo.model';
import { FormsModule } from '@angular/forms';
import { ModalArchivo } from '../modal-archivo/modal-archivo';
import { Gallery, GalleryItem, GalleryModule, ImageItem } from 'ng-gallery';
import { Lightbox, LightboxModule } from 'ng-gallery/lightbox';
import { ModalLogDelete } from '../modal-confirmar-logdelete/modal-confirmar-logdelete';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-archivo',
  imports: [FormsModule, ModalArchivo, GalleryModule, LightboxModule, ModalLogDelete],
  templateUrl: './archivo.html',
  styleUrl: './archivo.css'
})
export class ExpArchivo implements OnInit {
  private notify = inject(NotificationService);
  @Input() paciente!: { id_paciente: number };

  archivos: Archivo[] = [];        
  cargando: boolean = false;
  archivoAEliminar?: number;

  ModalArchivo = signal(false);  
  modalConfirmacion = signal(false);  
  archivoSeleccionado: Archivo | null = null;

  // lightbox + gallery
  items: GalleryItem[] = [];

  constructor(
    private archivoService: ArchivoService,
    private gallery: Gallery,
    private lightbox: Lightbox
  ) {}

  ngOnInit(): void {
    if (this.paciente) this.cargarArchivos();
  }

  cargarArchivos() {
    this.cargando = true;

    this.archivoService.obtenerArchivos(this.paciente.id_paciente)
      .subscribe({
        next: (res: Archivo[]) => {
          this.archivos = res;

          this.items = res.map(a =>
            new ImageItem({
              src: a.url_imagen,
              thumb: a.url_imagen
            })
          );

          this.gallery.ref('archivos').load(this.items);
          this.cargando = false;
        },
        error: () => this.cargando = false
      });
  }

  abrirImagen(i: number) {
    this.lightbox.open(i, 'archivos', {
      panelClass: 'fullscreen'
    });
  }

  abrirModalNuevo() {
    this.archivoSeleccionado = null;
    this.ModalArchivo.set(true);
  }


  editarArchivo(a: Archivo) {
    this.archivoSeleccionado = a;           
    this.ModalArchivo.set(true);
  }

  
  cerrarModal() {
    this.ModalArchivo.set(false);
  }

  
  onArchivoAgregado() {
    this.cerrarModal();
    this.cargarArchivos();  // recarga la lista
  }


  onArchivoActualizado() {
    this.cerrarModal();
    this.cargarArchivos(); // recarga actualizado
  }

  abrirModalEliminar(id_archivo: number) {
    this.archivoAEliminar = id_archivo;
    this.modalConfirmacion.set(true);
  }

  //MODAL DE CONFIRMAR SOFTDELETE !!!!
  cerrarModalSD() {
    this.modalConfirmacion.set(false);
    this.archivoAEliminar = undefined;
  }

  confirmarSoftDelete() {
    if (!this.archivoAEliminar) return;

    this.archivoService.ocultarArchivo(this.archivoAEliminar)
      .subscribe({
        next: () => {
          this.cargarArchivos(); // recarga la lista
          this.cerrarModalSD();     // cierra modal

          this.notify.success("Registro de tratamiento eliminado");
        },
        error: () => {
          this.notify.error("Error al eliminar el registro");
        }
      });
  }
}