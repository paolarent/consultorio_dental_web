import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-modal-ag-alergia',
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-ag-alergia.html',
  styleUrl: './modal-ag-alergia.css'
})
export class ModalAgAlergia {
  @Output() cerrar = new EventEmitter<void>();

  cancelar() {
    this.cerrar.emit();
  }
}
