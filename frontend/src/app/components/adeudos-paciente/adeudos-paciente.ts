import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { IngresoService } from '../../services/ingreso.service';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-adeudos-paciente',
  imports: [DecimalPipe],
  templateUrl: './adeudos-paciente.html',
  styleUrl: './adeudos-paciente.css'
})
export class AdeudosPaciente implements OnInit {
  private ingresoService = inject(IngresoService);
  private cdr = inject(ChangeDetectorRef);

  ingresosPendientes: any[] = [];
  totalPendiente: number = 0;

  ngOnInit(): void {
    this.cargarPendientes();
  }

  cargarPendientes() {
    this.ingresoService.historialIngresosPendientesPaciente().subscribe({
      next: (data) => {
        this.ingresosPendientes = data;
        this.calcularTotalPendiente();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar ingresos pendientes', err)
    });
  }

  calcularTotalPendiente() {
    this.totalPendiente = this.ingresosPendientes.reduce(
      (acc, ingreso) => acc + ingreso.saldoPendiente,
      0
    );
  }
}
