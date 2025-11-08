import { Component, OnInit } from '@angular/core';
import { Alergia, AlergiasService } from '../../services/alergia.service';
import { CommonModule } from '@angular/common';
import { CondicionesMedicasService, CondicionMedica } from '../../services/cond-med.service';

@Component({
  selector: 'app-perfil-paciente',
  imports: [CommonModule],
  templateUrl: './perfil-paciente.html',
  styleUrl: './perfil-paciente.css'
})
export class PerfilPaciente implements OnInit {
  alergias: Alergia[] = [];
  condiciones: CondicionMedica[] = [];

  constructor(
    private alergiasService: AlergiasService,
    private condicionesService: CondicionesMedicasService
  ) {}


  ngOnInit(): void {
    // Cargar alergias
    this.alergiasService.listarAlergiasPaciente().subscribe({
      next: (data) => this.alergias = data,
      error: (err) => console.error('Error al obtener alergias', err)
    });

    this.condicionesService.listarCMPaciente().subscribe({
      next: (data) => {
        this.condiciones = data.map(cond => ({
          ...cond,
          medicamentos_formateados: Array.isArray(cond.medicamentos_actuales)
            ? cond.medicamentos_actuales.join(', ')
            : cond.medicamentos_actuales
        }));
      },
      error: (err) => console.error('Error al obtener condiciones médicas', err)
    });



  }
}
