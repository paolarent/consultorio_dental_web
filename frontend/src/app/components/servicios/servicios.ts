import { Component, inject, OnInit, signal } from '@angular/core';
import { ServicioService } from '../../services/servicio.service';
import { AuthService } from '../../auth/auth.service';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-servicios',
  imports: [],
  templateUrl: './servicios.html',
  styleUrl: './servicios.css'
})
export class Servicios implements OnInit {
  // Inyectamos servicios
  auth = inject(AuthService);
  servicioService = inject(ServicioService);

  decimalPipe = new DecimalPipe('es-MX');

  // Signals
  servicios = signal<any[]>([]);          // Todos los servicios
  serviciosFiltrados = signal<any[]>([]); // Servicios filtrados
  searchTerm = signal('');                // Texto de búsqueda

  ngOnInit() {
    const usuario = this.auth.usuario(); // Obtenemos el usuario

    if (usuario?.id_consultorio) {
      this.servicioService.findAllActive(usuario.id_consultorio).subscribe({
        next: (data) => {
          const formateado = data.map(s => ({
            ...s,
            precio_base_str: Number(s.precio_base).toFixed(2), // siempre string tipo "800.00"
            duracion_base_str: `${s.duracion_base} Min`        // Minutos en duracion
          }));

          this.servicios.set(formateado);           // Guardamos todos los servicios
          this.serviciosFiltrados.set(formateado);  // Inicializamos filtrados
        },
        error: (err) => console.error(err)
      });
    }
  }

  // Método para la barra de búsqueda
  buscarServicios(event: Event) {
    const input = event.target as HTMLInputElement;
    const valor = input.value.toLowerCase();
    this.searchTerm.set(valor);

    const filtrados = this.servicios().filter(servicio =>
      servicio.nombre.toLowerCase().includes(valor)
    );
    this.serviciosFiltrados.set(filtrados);
  }
}
