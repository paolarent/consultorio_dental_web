import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Calendario } from "../calendario/calendario";
import { ModalSolicCita } from '../modal-solic-cita/modal-solic-cita';
import { CitaService } from '../../services/cita.service';
import { DatePipe, NgClass } from '@angular/common';
import { ModalLogDelete } from '../modal-confirmar-logdelete/modal-confirmar-logdelete';
import { NotificationService } from '../../services/notification.service';
import { ModalReprogCita } from '../modal-reprog-cita/modal-reprog-cita';

@Component({
  selector: 'app-citas-paciente',
  imports: [Calendario, ModalSolicCita, NgClass, DatePipe, ModalLogDelete, ModalReprogCita],
  templateUrl: './citas-paciente.html',
  styleUrl: './citas-paciente.css'
})
export class CitasPaciente implements OnInit {
  private notify = inject(NotificationService);

  modalSolicCita = signal(false);
  modalReprogramar = signal(false);
  citaParaReprogramar: any = null;

  citas = signal<any[]>([]); // todas las citas
  citasProximas = computed(() => this.citas().filter(c => ['pendiente','reprogramada','programada'].includes(c.status)));
  citasHistorial = computed(() => this.citas().filter(c => ['completada', 'cancelada'].includes(c.status)));

   //PARA EL MODAL
  modalVisible = signal(false);
  modalTitulo = signal('');
  modalTexto = signal('');
  modalTipo = signal<'cancelar' | 'programar'>('cancelar');
  citaSeleccionada: any = null;

  private citaService = inject(CitaService);

  ngOnInit() {
    this.refrescarCitas();
  }

  refrescarCitas() {
    this.citaService.listarCitasPaciente().subscribe({
      next: (data) => this.citas.set(data),
      error: (err) => console.error(err)
    });
  }

  abrirModal() {
    this.modalSolicCita.set(true);
  }

  cerrarModal() {
    this.modalSolicCita.set(false);
    this.refrescarCitas();
  }

  abrirModalAUS(cita: any, tipo: 'cancelar' | 'programar') {
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

      case 'programar':
        this.modalTitulo.set('Aceptar Reprogramar');
        this.modalTexto.set(`¿Desea reprogramar esta cita?`);
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

      case 'programar':
        // Cita reprogramada va a aceptar/rechazar reprogramación
        this.citaService.responderReprogramacion(cita.id_reprogramacion, { aceptar: true }).subscribe({
          next: (res: any) => handleResponse(res.mensaje || 'Reprogramación aceptada correctamente'),
          error: handleError
        });
        break;
    }

    this.modalVisible.set(false);
  }

  cancelarModal() {
    this.modalVisible.set(false);
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
        this.modalReprogramar.set(false);
        this.citaParaReprogramar = null;
      }
    });
  }


}
