import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-modal-monto-inicial',
  imports: [FormsModule],
  templateUrl: './modal-monto-inicial.html',
  styleUrl: './modal-monto-inicial.css'
})
export class ModalMontoInicial {
  @Output() aceptar = new EventEmitter<number>();
  @Output() cerrar = new EventEmitter<void>();

  monto: number | null = null;

  continuar() {
    if (!this.monto || this.monto <= 0) return; 
    this.aceptar.emit(this.monto);
  }

  volver() {
    this.cerrar.emit();
  }
}
