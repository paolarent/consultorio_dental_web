import { Component, Input, OnInit, signal } from '@angular/core';
import { ArchivoService } from '../../services/archivo.service';
import { Archivo } from '../../models/archivo.model';
import { FormsModule } from '@angular/forms';
import { ModalArchivo } from '../modal-archivo/modal-archivo';
import { Gallery, GalleryItem, GalleryModule, ImageItem } from 'ng-gallery';
import { Lightbox, LightboxModule } from 'ng-gallery/lightbox';


@Component({
  selector: 'app-archivo',
  imports: [FormsModule, ModalArchivo, GalleryModule, LightboxModule],
  templateUrl: './archivo.html',
  styleUrl: './archivo.css'
})
export class ExpArchivo implements OnInit {
  @Input() paciente!: { id_paciente: number };  // obligatorio

  archivos = signal<Archivo[]>([]);  // señal con tipo correcto
  cargando = false;

  ModalArchivo = signal(false);
  items: GalleryItem[] = [];

  constructor(
    private archivoService: ArchivoService,
    private gallery: Gallery,
    private lightbox: Lightbox
  ) {}

  ngOnInit(): void {
    if (this.paciente) {
      this.cargarArchivos();
    }
  }

  cargarArchivos() {
    this.cargando = true;

    this.archivoService.obtenerArchivos(this.paciente.id_paciente).subscribe({
      next: (res) => {
        this.archivos.set(res);

        this.items = res.map(a =>
          new ImageItem({
            src: a.url_imagen,
            thumb: a.url_imagen
          })
        );

        const galleryRef = this.gallery.ref('archivos');
        galleryRef.load(this.items);

        this.cargando = false;
      },
      error: () => (this.cargando = false)
    });
  }

  abrirImagen(i: number) {
    this.lightbox.open(i, 'archivos', {
      panelClass: 'fullscreen'
    });
  }

  abrirModal() {
    this.ModalArchivo.set(true);
  }

  onArchivoAgregado(archivo: Archivo) {
    // Añadir el nuevo archivo al listado
    this.archivos.set([...this.archivos(), archivo]);
    this.ModalArchivo.set(false);
  }
}