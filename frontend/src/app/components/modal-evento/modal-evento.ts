import { Component, ElementRef, EventEmitter, inject, Input, Output, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { EventoService } from '../../services/evento.service';
import { NgxMaterialTimepickerComponent, NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import flatpickr from 'flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es.js';
import { CreateEventoDto, Evento } from '../../models/evento.model';
import { SiONo } from '../../../../../backend/src/common/enums';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-modal-evento',
  imports: [FormsModule, MatFormFieldModule, MatSelectModule, MatOptionModule, NgxMaterialTimepickerModule],
  templateUrl: './modal-evento.html',
  styleUrl: './modal-evento.css'
})
export class ModalEvento {
  private notify = inject(NotificationService);

  @Output() cerrar = new EventEmitter<void>();
  @Output() guardar = new EventEmitter<any>();

  @Input() modoEdicion = false;
  @Input() idEventoEditar: number | null = null;

  titulo: string = '';
  id_tipo_evento!: number;
  fecha_inicio: string = '';
  fecha_fin: string = '';
  hora_inicio: string = '';
  hora_fin: string = '';
  notas: string = '';
  eventoFullDia = signal(false);

  cargando = signal(false);

  @ViewChild('fechaInicioInput') fechaInicioInput!: ElementRef<HTMLInputElement>;
  @ViewChild('fechaFinInput') fechaFinInput!: ElementRef<HTMLInputElement>;

  private fpInicio: any;
  private fpFin: any; 

  tiposEvento: {id_tipo_evento: number; nombre: string} [] = [];
  constructor(private eventoService: EventoService) {}

  ngOnInit(): void {
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

  ngAfterViewInit() {
    this.initFlatpickr();

    if (this.modoEdicion && this.idEventoEditar) {
        this.cargarEventoParaEdicion();
    } else {
        this.limpiarCampos(); // para creación
    }
  }

  // ------------------- Flatpickr -------------------
  private initFlatpickr() {
    // Fecha inicio
    if (this.fechaInicioInput) {
      this.fpInicio = flatpickr(this.fechaInicioInput.nativeElement, {
        dateFormat: 'Y-m-d',
        locale: Spanish,
        allowInput: true,
        defaultDate: this.fecha_inicio || undefined,
        minDate: new Date(),
        onChange: (dates) => {
          this.fecha_inicio = dates[0] ? dates[0].toISOString().split('T')[0] : '';
        }
      });
    }

    // Fecha fin
    if (this.fechaFinInput) {
      this.fpFin = flatpickr(this.fechaFinInput.nativeElement, {
        dateFormat: 'Y-m-d',
        locale: Spanish,
        allowInput: true,
        defaultDate: this.fecha_fin || undefined,
        minDate: this.fecha_inicio || new Date(), // si quieres que no sea menor a inicio
        onChange: (dates) => {
          this.fecha_fin = dates[0] ? dates[0].toISOString().split('T')[0] : '';
        }
      });
    }
  }

  toggleTodoDia() {
    this.eventoFullDia.update(value => !value);

    if (!this.eventoFullDia() && this.fechaInicioInput && this.fechaFinInput) {
      // Re-inicializar flatpickr si los inputs aparecen
      this.initFlatpickr();
    }

    if (this.eventoFullDia()) {
      this.hora_inicio = '';
      this.hora_fin = '';
    }
  }

  cargarEventoParaEdicion() {
    this.eventoService.obtenerEvento(this.idEventoEditar!).subscribe({
      next: ev => {

        this.titulo = ev.titulo;
        this.id_tipo_evento = ev.id_tipo_evento;

        this.fecha_inicio = ev.fecha_inicio.split("T")[0];
        this.fecha_fin = ev.fecha_fin.split("T")[0];

        this.eventoFullDia.set(ev.evento_todo_el_dia === "si");

        // Solo si NO es todo el día
        this.hora_inicio = ev.hora_inicio || "";
        this.hora_fin = ev.hora_fin || "";

        this.notas = ev.notas || "";
      },
      error: err => console.error("Error cargando evento:", err)
    });
  }

  private limpiarCampos() {
    this.titulo = '';
    this.id_tipo_evento = 0;
    this.fecha_inicio = '';
    this.fecha_fin = '';
    this.hora_inicio = '';
    this.hora_fin = '';
    this.notas = '';
    this.eventoFullDia.set(false);
  }


  cancelar(): void {
    this.cerrar.emit();
    this.limpiarCampos();
  }

  guardarEvento() {
    if (this.cargando()) return; // bloqueamos si ya está en proceso

    if (!this.titulo || !this.id_tipo_evento || !this.fecha_inicio || !this.fecha_fin) {
      this.notify.warning('Completa todos los campos obligatorios');
      return;
    }

    this.cargando.set(true);

    const evento: CreateEventoDto = {
      titulo: this.titulo,
      id_tipo_evento: this.id_tipo_evento,
      fecha_inicio: this.fecha_inicio,
      fecha_fin: this.fecha_fin,
      evento_todo_el_dia: this.eventoFullDia() ? SiONo.SI : SiONo.NO,
      hora_inicio: this.eventoFullDia() ? undefined : this.hora_inicio,
      hora_fin: this.eventoFullDia() ? undefined : this.hora_fin,
      notas: this.notas || undefined
    };

    if (this.modoEdicion && this.idEventoEditar) {
      // EDITAR
      this.eventoService.actualizarEvento(this.idEventoEditar, evento).subscribe({
      next: () => {
        // Obtener el evento actualizado completo
        this.eventoService.obtenerEvento(this.idEventoEditar!).subscribe({
          next: evActualizado => {
            this.notify.success('Evento actualizado correctamente');
            this.guardar.emit(evActualizado);
            setTimeout(() => this.cerrar.emit(), 50);
          },
          error: (err) => {
            console.error('Error obteniendo evento actualizado', err);
            this.notify.error('Evento actualizado pero hubo error al refrescar');
          }
        });
      },
      error: (err) => {
        console.error(err);
        this.notify.error(err.error?.message || 'Error al actualizar evento');
        this.cargando.set(false);
      },
      complete: () => this.cargando.set(false)
      });
    } else {
      // CREAR
      this.eventoService.createEvento(evento).subscribe({
        next: (res) => {
          // Obtener el evento completo recién creado
          this.eventoService.obtenerEvento(res.id_evento).subscribe({
            next: (eventoCreado) => {
              this.notify.success('Evento creado correctamente');
              this.guardar.emit(eventoCreado);
              // cerrar modal después de un pequeño delay
              setTimeout(() => this.cerrar.emit(), 50);
            },
            error: (err) => {
              console.error('Error obteniendo evento creado:', err);
              this.notify.error('Evento creado, pero no se pudo actualizar la lista');
            }
          });
        },
        error: (err) => {
          console.error(err);
          this.notify.error(err.error?.message || 'Error al crear evento');
          this.cargando.set(false); 
        },
        complete: () => this.cargando.set(false)
      });
    }
  }


}
