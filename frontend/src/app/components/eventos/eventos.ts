import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Calendario } from '../calendario/calendario';
import { ModalConfigHorario } from '../modal-config-horario/modal-config-horario';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { ModalEvento } from '../modal-evento/modal-evento';
import { Evento } from '../../models/evento.model';
import { EventoService } from '../../services/evento.service';
import { NotificationService } from '../../services/notification.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-eventos',
  imports: [RouterModule, Calendario, ModalConfigHorario, MatFormFieldModule, MatSelectModule, MatOptionModule, ModalEvento, DatePipe],
  templateUrl: './eventos.html',
  styleUrl: './eventos.css'
})
export class Eventos {
  id_tipo_evento!: number;
  tiposEvento: {id_tipo_evento: number; nombre: string} [] = [];

  mostrarModalHorario = signal(false);
  modalEvento = signal(false);

  loading = true;
  eventos = signal<Evento[]>([]);        // lista original
  search = signal('');                  // texto del buscador
  filtro = signal('todos');             // tipo de filtro seleccionado

  constructor(private router: Router) {}
  private eventoService = inject(EventoService);
  private notify = inject(NotificationService);

  ngOnInit(): void {
    this.cargarEventos();

    this.eventoService.listarTiposEvento().subscribe({
      next: (tipos) => {
        // seguridad: forzar a array
        this.tiposEvento = Array.isArray(tipos) ? tipos : [];
      },
      error: (err) => {
        console.error('Error al cargar tipos de evento', err);
        this.tiposEvento = [];
      }
    });
  }

  eventosFiltrados = computed(() => {   // lista filtrada automática
    const texto = this.search().toLowerCase();
    const tipo = this.filtro();
    const lista = this.eventos();

    return lista.filter(ev => {
      const coincideTexto =
        ev.titulo.toLowerCase().includes(texto) ||
        (ev.notas?.toLowerCase().includes(texto) ?? false);

      const coincideTipo =
        tipo === 'todos' ? true : ev.tipo_evento?.nombre.toLowerCase() === tipo.toLowerCase();

      return coincideTexto && coincideTipo;
    });
  });

  irACitas() {
    this.router.navigate(['doc/mi-agenda/citas']); 
  }

  abrirModalHorario() {
    this.mostrarModalHorario.set(true);
  }

  cerrarModal() {
    this.mostrarModalHorario.set(false);
  }

  cerrarModalEvento() {
    this.modalEvento.set(false);
  }

  abrirModalEvento() {
    this.modalEvento.set(true);
  }

  cargarEventos() {
    this.loading = true;

    this.eventoService.listarEventosActivos().subscribe({
      next: (data) => {
        this.eventos.set(data);
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  // Métodos para actualizar signals desde el template
  actualizarBusqueda(value: string) {
    this.search.set(value);
  }

  actualizarFiltro(value: string) {
    this.filtro.set(value);
  }

}
