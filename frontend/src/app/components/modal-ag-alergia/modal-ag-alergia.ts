import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { Severidad } from '../../../../../backend/src/common/enums';
import { AlergiasService } from '../../services/alergia.service';

@Component({
  selector: 'app-modal-ag-alergia',
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatSelectModule, MatOptionModule],
  templateUrl: './modal-ag-alergia.html',
  styleUrl: './modal-ag-alergia.css'
})
export class ModalAgAlergia implements OnInit {
  @Output() cerrar = new EventEmitter<void>();
  @Output() agregar = new EventEmitter<any>();

  nombreAlergia: string = '';
  id_tipo_alergia!: number;
  severidad!: Severidad;
  notas: string = '';

  tiposAlergia: { id_tipo_alergia: number; nombre: string }[] = [];
  Severidad = Severidad; // para usarlo en el HTML

  constructor(private alergiasService: AlergiasService) {}

  ngOnInit(): void {
    this.alergiasService.listarTiposAlergia().subscribe({
      next: (tipos) => (this.tiposAlergia = tipos),
      error: (err) => console.error('Error al cargar tipos de alergia', err)
    });
  }

  cancelar() {
    this.cerrar.emit();
  }

  guardar() {
    if (!this.nombreAlergia || !this.id_tipo_alergia || !this.severidad) return;

    const dto = {
      nombre: this.nombreAlergia,
      id_tipo_alergia: this.id_tipo_alergia,
      severidad: this.severidad,
      notas: this.notas
    };

    this.agregar.emit(dto);
  }
}