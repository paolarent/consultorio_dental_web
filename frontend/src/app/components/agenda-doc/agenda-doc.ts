import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Calendario } from '../calendario/calendario';
import { ModalConfigHorario } from '../modal-config-horario/modal-config-horario';
import { ModalCreateCita } from '../modal-create-cita/modal-create-cita';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { CitaService } from '../../services/cita.service';
import { FormsModule } from '@angular/forms';
import { DatePipe, NgClass, registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { ModalLogDelete } from '../modal-confirmar-logdelete/modal-confirmar-logdelete';
import { NotificationService } from '../../services/notification.service';
import { ModalReprogCita } from "../modal-reprog-cita/modal-reprog-cita";
  
registerLocaleData(localeEs, 'es');

@Component({
  selector: 'app-agenda-doc',
  imports: [FormsModule, DatePipe, NgClass, RouterModule, Calendario, ModalConfigHorario, ModalCreateCita,
    MatFormFieldModule, MatSelectModule, MatOptionModule, ModalLogDelete, ModalReprogCita],
  templateUrl: './agenda-doc.html',
  styleUrl: './agenda-doc.css'
})
export class AgendaDoc {
  private notify = inject(NotificationService);

  modalHorario = signal(false);
  modalCrearCita = signal(false);

  citas = signal<any[]>([]);

  //Búsqueda
  searchTerm = signal('');
  //Filtro por estado
  filtroEstado = signal('todas');

  //PARA EL MODAL
  modalVisible = signal(false);
  modalTitulo = signal('');
  modalTexto = signal('');
  modalTipo = signal<'cancelar' | 'completar' | 'programar'>('cancelar');
  citaSeleccionada: any = null;

  //Para Reprogramar
  modalReprogramar = signal(false);
  citaParaReprogramar: any = null;

  citasFiltradas = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const filtro = this.filtroEstado();
    const lista = this.citas();

    return lista.filter(cita => {
      const coincideBusqueda =
        cita.paciente.toLowerCase().includes(term) ||
        cita.servicio?.toLowerCase().includes(term);

      const coincideFiltro =
        filtro === 'todas' ? true : cita.status === filtro;

      return coincideBusqueda && coincideFiltro;
    });
  });

  private citaService = inject(CitaService);
  constructor(private router: Router) {}

  ngOnInit() {
      this.citaService.listarCitasDentista().subscribe({
          next: (data) => this.citas.set(data),
          error: (err) => console.error(err)
      });
  }

  actualizarBusqueda(event: any) {
    this.searchTerm.set(event.target.value);
  }

  //FILTRO
  cambiarFiltro(valor: string) {
    this.filtroEstado.set(valor);
  }

  irAEventos() {
    this.router.navigate(['doc/mi-agenda/eventos']);
  }

  abrirModalHorario() {
    this.modalHorario.set(true);
  }

  cerrarModalHorario() {
    this.modalHorario.set(false);
    this.refrescarCitas();
  }

  abrirModalCrearCita() {
    this.modalCrearCita.set(true);
  }

  cerrarModalCrearCita() {
    this.modalCrearCita.set(false);
    this.refrescarCitas();
  }

  abrirModalAUS(cita: any, tipo: 'cancelar' | 'completar' | 'programar') {
    this.citaSeleccionada = cita;
    this.modalTipo.set(tipo);

    switch(tipo) {
      case 'cancelar':
        if (cita.status === 'reprogramada') {
          this.modalTitulo.set('Rechazar Reprogramar');
          this.modalTexto.set(`¿Desea rechazar la solicitud de reprogramar esta cita?`);
        } else {
          this.modalTitulo.set('Cancelar Cita');
          this.modalTexto.set(`¿Seguro que desea cancelar la cita?`);
        }
      break;

      case 'completar':
        this.modalTitulo.set('Marcar Cita Completada');
        this.modalTexto.set(`¿Desea marcar como completada la cita?`);
      break;

      case 'programar':
        if (cita.status === 'pendiente') {
          this.modalTitulo.set('Programar cita');
          this.modalTexto.set(`¿Desea programar esta cita pendiente?`);
        } else if (cita.status === 'reprogramada') {
          this.modalTitulo.set('Aceptar Reprogramar');
          this.modalTexto.set(`¿Desea reprogramar esta cita?`);
        }
        
      break;
    }

    this.modalVisible.set(true);
  }

  confirmarModal() {
    const cita = this.citaSeleccionada;
    if (!cita) return;

    const handleResponse = (successMessage: string) => {
      this.refrescarCitas();
      this.notify.success(successMessage); // Notificación de éxito
      this.modalVisible.set(false);
    };

    const handleError = (err: any) => {
      console.error(err);
      this.notify.error('Ocurrió un error. Intenta de nuevo');
    };

    switch(this.modalTipo()) {
      case 'cancelar':
        if (cita.status === 'reprogramada') {
          // rechazar reprogramacion
          this.citaService.responderReprogramacion(cita.id_reprogramacion, { aceptar: false }).subscribe({
            next: (res: any) => handleResponse(res.mensaje || 'Reprogramación rechazada correctamente'),
            error: handleError
          });
        } else {
          this.citaService.cancelarCita(cita.id_cita).subscribe({
            next: () => handleResponse('Cita cancelada correctamente'),
            error: handleError
          });
        }
      break;

      case 'completar':
        this.citaService.marcarCitaCompletada(cita.id_cita).subscribe({
          next: () => handleResponse('Cita completada correctamente'),
          error: handleError
        });
        break;

      case 'programar':
        if (cita.status === 'pendiente') {
          // Cita pendiente toca actualizar estado normal
          this.citaService.actualizarStatusCita(cita.id_cita, 'programada').subscribe({
            next: () => handleResponse('Cita programada correctamente'),
            error: handleError
          });
        } else if (cita.status === 'reprogramada' && cita.id_reprogramacion) {
          // Cita reprogramada va a aceptar reprogramación
          this.citaService.responderReprogramacion(cita.id_reprogramacion, { aceptar: true }).subscribe({
            next: (res: any) => handleResponse(res.mensaje || 'Reprogramación aceptada correctamente'),
            error: handleError
          });
        }
      break;

    }

    this.modalVisible.set(false);
  }

  cancelarModal() {
    this.modalVisible.set(false);
  }

  refrescarCitas() {
    this.citaService.listarCitasDentista().subscribe(data => this.citas.set(data));
  }

  abrirModalReprogramar(cita: any) {
    this.citaParaReprogramar = cita;
    this.modalReprogramar.set(true);
  }

  cerrarModalReprogramar() {
    this.modalReprogramar.set(false);
    this.citaParaReprogramar = null;
  }

  reprogramarCita(event: { fecha: string, hora: string }) {
    if (!this.citaParaReprogramar) return;

    const { fecha, hora } = event;
    const id_cita = this.citaParaReprogramar.id_cita;

    //this.notify.success('Enviando solicitud de reprogramación...');

    this.citaService.solicitarReprogramacion(id_cita, fecha, hora).subscribe({
      next: (res: any) => {
        this.notify.success(res.mensaje || 'Solicitud enviada correctamente');
        this.refrescarCitas();
        this.modalReprogramar.set(false);
        this.citaParaReprogramar = null;
      },
      error: (err: any) => {
        console.error(err);
        this.notify.error(err?.error?.message || 'Ocurrió un error al reprogramar');
      }
    });
  }

}
