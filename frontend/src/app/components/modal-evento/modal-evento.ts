import { Component, ElementRef, EventEmitter, inject, Output, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { EventoService } from '../../services/evento.service';
import { NgxMaterialTimepickerComponent, NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import flatpickr from 'flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es.js';
import { Evento } from '../../models/evento.model';
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

  cancelar(): void {
    this.cerrar.emit();
  }

  guardarEvento() {
    if (this.cargando()) return; // bloqueamos si ya está en proceso

    if (!this.titulo || !this.id_tipo_evento || !this.fecha_inicio || !this.fecha_fin) {
      this.notify.warning('Completa todos los campos obligatorios');
      return;
    }

    this.cargando.set(true);
    const evento: Evento = {
      titulo: this.titulo,
      id_tipo_evento: this.id_tipo_evento,
      fecha_inicio: this.fecha_inicio,
      fecha_fin: this.fecha_fin,
      evento_todo_el_dia: this.eventoFullDia() ? SiONo.SI : SiONo.NO,
      hora_inicio: this.eventoFullDia() ? undefined : this.hora_inicio,
      hora_fin: this.eventoFullDia() ? undefined : this.hora_fin,
      notas: this.notas || undefined
    };

    this.eventoService.createEvento(evento).subscribe({
      next: (res) => {
        this.notify.success('Evento creado correctamente');
        this.guardar.emit(res);
        this.cerrar.emit();
      },
      error: (err) => {
        console.error(err);
        this.notify.error('Error al crear evento');
        this.cargando.set(false); 
      },
      complete: () => this.cargando.set(false)
    });
  }

}
