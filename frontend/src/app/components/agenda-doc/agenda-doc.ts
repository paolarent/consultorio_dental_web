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
import { DatePipe, NgClass, registerLocaleData, TitleCasePipe } from '@angular/common';
import localeEs from '@angular/common/locales/es';
  
registerLocaleData(localeEs, 'es');

@Component({
  selector: 'app-agenda-doc',
  imports: [FormsModule, DatePipe, NgClass, RouterModule, Calendario, ModalConfigHorario, ModalCreateCita, MatFormFieldModule, MatSelectModule, MatOptionModule],
  templateUrl: './agenda-doc.html',
  styleUrl: './agenda-doc.css'
})
export class AgendaDoc {
  modalHorario = signal(false);
  modalCrearCita = signal(false);

  citas = signal<any[]>([]);

  //Búsqueda
  searchTerm = signal('');
  //Filtro por estado
  filtroEstado = signal('todas');

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
  }

  abrirModalCrearCita() {
    this.modalCrearCita.set(true);
  }

  cerrarModalCrearCita() {
    this.modalCrearCita.set(false);
  }


}
