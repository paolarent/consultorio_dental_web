import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-modal-confirmar-logdelete',
  imports: [],
  templateUrl: './modal-confirmar-logdelete.html',
  styleUrl: './modal-confirmar-logdelete.css'
})
export class ModalLogDelete {
  @Input() visible = false;
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm() {
    this.confirm.emit();
  }

  onCancel() {
    this.cancel.emit();
  }
}