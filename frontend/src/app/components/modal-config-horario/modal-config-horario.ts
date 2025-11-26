import { Component, EventEmitter, inject, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HorarioService } from '../../services/horario.service';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { MatInputModule } from '@angular/material/input';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-modal-config-horario',
  imports: [FormsModule, MatInputModule, NgxMaterialTimepickerModule],
  templateUrl: './modal-config-horario.html',
  styleUrl: './modal-config-horario.css'
})
export class ModalConfigHorario {
  private notify = inject(NotificationService);

  @Output() cerrar = new EventEmitter<void>();

  private horarioSrv = inject(HorarioService);

  diasSemana = signal<any[]>([]);
  tp1: any;

  constructor() {
    this.cargarHorario();
  }

  cargarHorario() {
    this.horarioSrv.obtenerHorario().subscribe({
      next: (data) => {
        const diasMapeados = this.mapearHorarioBackend(data);
        this.diasSemana.set(diasMapeados);
      },
      error: (err) => console.error(err)
    });
  }

  private mapearHorarioBackend(horarioBackend: any[]) {
    const dias = [1,2,3,4,5,6,7];

    return dias.map(dia => {
      const registros = horarioBackend.filter(h => h.dia === dia);

      if (registros.length === 0) {
        return {
          dia,
          nombre: this.nombreDia(dia),
          activo: false,
          hora_inicio: '',
          hora_fin: '',
          id_turno1: null,
          segundoTurno: false,
          turno2_inicio: '',
          turno2_fin: '',
          id_turno2: null
        };
      }

      // --- ORDENAR LOS TURNOS POR HORA  ---
      const registrosOrdenados = [...registros].sort((a, b) =>
        this.convertirHora(a.hora_inicio) - this.convertirHora(b.hora_inicio)
      );

      const turno1 = registrosOrdenados[0];
      const turno2 = registrosOrdenados[1]; // puede ser undefined

      return {
        dia,
        nombre: this.nombreDia(dia),
        activo: true,
        //TURNO PRINCIPAL
        hora_inicio: turno1.hora_inicio,
        hora_fin: turno1.hora_fin,
        id_turno1: turno1.id_horario,
        //TURNO DOS
        segundoTurno: !!turno2,
        turno2_inicio: turno2?.hora_inicio ?? '',
        turno2_fin: turno2?.hora_fin ?? '',
        id_turno2: turno2?.id_horario ?? null
      };
    });
  }

  private convertirHora(hora: string): number {
    if (!hora) return -1;

    const partes = hora.trim().split(' ');
    const numero = parseInt(partes[0], 10);
    const meridiano = partes[1]?.toUpperCase() ?? '';

    if (meridiano === 'PM' && numero !== 12) return numero + 12;
    if (meridiano === 'AM' && numero === 12) return 0;

    return numero;
  }

  private nombreDia(dia: number) {
    const nombres = [
      'Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'
    ];
    return nombres[dia-1];
  }

  toggleDia(dia: any) {
    dia.activo = !dia.activo;
  }

  toggleSegundoTurno(dia: any) {
    dia.segundoTurno = !dia.segundoTurno;

    if (!dia.segundoTurno) {
      dia.turno2_inicio = '';
      dia.turno2_fin = '';
    }
  }

  cancelar() {
    this.cerrar.emit();
  }

  guardarCambios() {
    const payload: any[] = [];

    for (const dia of this.diasSemana()) {

      if (!dia.activo) {
        if (dia.id_turno1) payload.push({ delete: dia.id_turno1 });
        if (dia.id_turno2) payload.push({ delete: dia.id_turno2 });
        continue;
      }

      // --- VALIDAR TURNO 1 ---
      if (!dia.hora_inicio || !dia.hora_fin)
        return this.notify.warning(`Debes llenar el turno del día ${dia.nombre}`);

      const inicio1 = this.convertirHora(dia.hora_inicio);
      const fin1 = this.convertirHora(dia.hora_fin);

      if (inicio1 >= fin1)
        return this.notify.error(`El turno 1 del día ${dia.nombre} es inválido`);

      payload.push({
        id: dia.id_turno1,
        dia: dia.dia,
        inicio: dia.hora_inicio,
        fin: dia.hora_fin
      });

      // --- VALIDAR TURNO 2 ---
      if (dia.segundoTurno) {
        if (!dia.turno2_inicio || !dia.turno2_fin)
          return this.notify.warning(`Debes llenar el segundo turno del día ${dia.nombre}`);

        const inicio2 = this.convertirHora(dia.turno2_inicio);
        const fin2 = this.convertirHora(dia.turno2_fin);

        if (inicio2 >= fin2)
          return this.notify.error(`El segundo turno del día ${dia.nombre} es inválido`);

        // Validar que NO se traslape con turno1
        if (!(fin2 <= inicio1 || inicio2 >= fin1))
          return this.notify.error(`El segundo turno del día ${dia.nombre} se traslapa con el turno principal`);

        payload.push({
          id: dia.id_turno2,
          dia: dia.dia,
          inicio: dia.turno2_inicio,
          fin: dia.turno2_fin
        });

      } else {
        if (dia.id_turno2) payload.push({ delete: dia.id_turno2 });
      }
    }

    this.sincronizarConBackend(payload);
  }


  sincronizarConBackend(payload: any[]) {
    this.horarioSrv.updateHorario(payload).subscribe({
      next: () => {
        this.notify.success('Horario actualizado correctamente');
        this.cerrar.emit();
      },
      error: (err) => {
        console.error(err);
        this.notify.error(err.error.message || 'Error al actualizar horario');
      }
    });
  }


}