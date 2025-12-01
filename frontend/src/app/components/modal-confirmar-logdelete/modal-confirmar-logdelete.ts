import { NgClass } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-modal-confirmar-logdelete',
  imports: [NgClass],
  templateUrl: './modal-confirmar-logdelete.html',
  styleUrl: './modal-confirmar-logdelete.css'
})
export class ModalLogDelete {
  @Input() visible = false;
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  @Input() titulo: string = '';
  @Input() texto: string = '';
  @Input() tipo: 'cancelar' | 'completar' | 'programar' = 'cancelar';

  get icono() {
    switch(this.tipo) {
      case 'cancelar': return 'assets/icons/simbolo-eliminar.svg';
      case 'completar': return 'assets/icons/completar_cita.svg';
      case 'programar': return 'assets/icons/programar_cita.svg';
    }
  }

  get colorBotonConfirm() {
    switch(this.tipo) {
      case 'cancelar': return 'bg-red-700 hover:bg-red-800';
      case 'completar': return 'bg-green-900 hover:bg-green-800';
      case 'programar': return 'bg-teal-900 hover:bg-teal-800';
    }
  }

  onConfirm() {
    this.confirm.emit();
  }

  onCancel() {
    this.cancel.emit();
  }
}