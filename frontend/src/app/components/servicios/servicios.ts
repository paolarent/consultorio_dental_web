import { Component, inject, OnInit, signal } from '@angular/core';
import { ServicioService } from '../../services/servicio.service';
import { AuthService } from '../../auth/auth.service';
import { ModalAgServicio } from "../modal-ag-servicio/modal-ag-servicio";
import { Servicio, ServicioConFormato } from '../../models/servicio';
import { ModalLogDelete } from '../modal-confirmar-logdelete/modal-confirmar-logdelete';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-servicios',
  imports: [ModalAgServicio, ModalLogDelete],
  templateUrl: './servicios.html',
  styleUrl: './servicios.css'
})
export class Servicios implements OnInit {
  auth = inject(AuthService);
  servicioService = inject(ServicioService);
  private notify = inject(NotificationService);

  //modal para el softdelete
  modalConfirmacion = signal(false);
  servicioAEliminar: number | null = null;

  // Modal
  ModalAgServicio = signal(false);

  // Signals
  servicios = signal<ServicioConFormato[]>([]);
  serviciosFiltrados = signal<ServicioConFormato[]>([]);
  searchTerm = signal('');
  servicioSeleccionado = signal<Servicio | null>(null);

  ngOnInit() {
    this.recargarServicios();
  }

  // Buscar servicios
  buscarServicios(event: Event) {
    const valor = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchTerm.set(valor);

    const filtrados = this.servicios().filter(servicio =>
      servicio.nombre.toLowerCase().includes(valor)
    );
    this.serviciosFiltrados.set(filtrados);
  }

  // Nuevo servicio
  nuevoServicio() {
    this.servicioSeleccionado.set(null); // limpiar selección
    this.ModalAgServicio.set(true);
  }

  // Editar servicio
  editarServicio(servicio: Servicio) {
    this.servicioSeleccionado.set(servicio);
    this.ModalAgServicio.set(true);
  }

  // Cerrar modal
  cerrarModal() {
    this.ModalAgServicio.set(false);
    this.servicioSeleccionado.set(null); // limpiar selección
    this.recargarServicios();
  }

  // Recargar lista de servicios
  recargarServicios() {
    const usuario = this.auth.usuario();
    if (!usuario?.id_consultorio) return;

    this.servicioService.findAllActive(usuario.id_consultorio).subscribe({
      next: (data) => {
        const formateado: ServicioConFormato[] = data.map(s => ({
          ...s,
          precio_base_str: Number(s.precio_base).toFixed(2),
          duracion_base_str: `${s.duracion_base} Min`
        }));
        this.servicios.set(formateado);
        this.serviciosFiltrados.set(formateado);
      },
      error: (err) => console.error(err)
    });
  }

  abrirModalEliminar(id: number) {
    this.servicioAEliminar = id;
    this.modalConfirmacion.set(true);
  }

  cerrarModalSD() {
    this.modalConfirmacion.set(false);
    this.servicioAEliminar = null;
  }

  confirmarEliminacion() {
    if (!this.servicioAEliminar) return;

    this.servicioService.softDelete(this.servicioAEliminar).subscribe({
      next: () => {
        this.recargarServicios();   // recarga la lista
        this.cerrarModalSD();       // cierra el modal correctamente

        this.notify.success("Servicio dado de baja correctamente");
      },
      error: () => {
        this.notify.error("Ocurrió un error al dar de baja el servicio");
      }
    });
  }

}