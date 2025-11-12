import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-modal-ag-condmed',
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-ag-condmed.html',
  styleUrl: './modal-ag-condmed.css'
})
export class ModalAgCondmed {
  @Output() cerrar = new EventEmitter<void>();

  cancelar() {
    this.cerrar.emit();
  }
}
