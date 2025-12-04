import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { SiONo } from '../../shared/enums';
import { CondicionesMedicasService } from '../../services/cond-med.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-modal-ag-condmed',
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatSelectModule, MatOptionModule],
  templateUrl: './modal-ag-condmed.html',
  styleUrl: './modal-ag-condmed.css'
})
export class ModalAgCondmed implements OnInit {
  private notify = inject(NotificationService);

  @Output() cerrar = new EventEmitter<void>();
  @Output() guardar = new EventEmitter<any>();

  private condicionesMedicasService = inject(CondicionesMedicasService);

  tiposCondMed: any[] = [];
  condicion_controlada: SiONo = SiONo.NO; // default
  nombre = '';
  id_tipo_condicion = 0;
  a_o_diagnostico: number | null = null;
  medicamentos_actuales: string = '';
  currentYear = new Date().getFullYear(); 

  ngOnInit() {
    this.condicionesMedicasService.listarTiposCondiciones().subscribe({
      next: (tipos) => (this.tiposCondMed = tipos),
      error: (err) => console.error('Error al cargar tipos de condición médica:', err),
    });
  }

  cancelar() {
    this.cerrar.emit();
  }

  toggleCondicion() {
    this.condicion_controlada =
      this.condicion_controlada === SiONo.SI ? SiONo.NO : SiONo.SI;
  }

  agregar() {
    if (!this.nombre || !this.id_tipo_condicion || !this.a_o_diagnostico) return;

    if (this.a_o_diagnostico < 1950 || this.a_o_diagnostico > this.currentYear) {
      this.notify.error('El año de diagnóstico no es válido.');
      return;
    }

    // Si no escribió nada, usar valor por defecto
    const textoMed = this.medicamentos_actuales.trim()
      ? this.medicamentos_actuales
      : 'No medicación';

    const medicamentos_json = textoMed
      .split(',')
      .map((m) => m.trim())
      .filter((m) => m.length > 0);

    const dto = {
      nombre: this.nombre,
      id_tipo_condicion: this.id_tipo_condicion,
      a_o_diagnostico: this.a_o_diagnostico,
      medicamentos_actuales: medicamentos_json,
      condicion_controlada: this.condicion_controlada,
    };

    this.guardar.emit(dto);
  }

}