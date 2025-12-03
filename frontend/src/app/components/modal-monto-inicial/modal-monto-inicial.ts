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

  // Validar mientras el usuario escribe
  onMontoChange(event: any) {
    const valor = event.target.value;
    
    // Si es vacío, permitir null
    if (valor === '' || valor === null) {
      this.monto = null;
      return;
    }
    
    // Convertir a número y validar
    const numero = parseFloat(valor);
    
    // Si es negativo o NaN, poner en 0
    if (isNaN(numero) || numero < 0) {
      this.monto = 0;
      event.target.value = 0;
      return;
    }
    
    this.monto = numero;
  }

  continuar() {
    // Validaciones finales antes de emitir
    if (this.monto === null || this.monto === undefined) return;
    if (this.monto < 0) {
      this.monto = 0;
      return;
    }
    
    this.aceptar.emit(this.monto);
  }


  volver() {
    this.cerrar.emit();
  }
}
