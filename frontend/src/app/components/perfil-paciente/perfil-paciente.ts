import { Component, OnInit, signal } from '@angular/core';
import { Alergia, AlergiasService } from '../../services/alergia.service';
import { CommonModule } from '@angular/common';
import { CondicionesMedicasService, CondicionMedica } from '../../services/cond-med.service';
import { Sexo, SiONo } from '../../../../../backend/src/common/enums';
import { ModalEditarPaciente } from '../modal-editar-paciente/modal-editar-paciente';
import { UpdatePaciente } from '../../models/update-paciente.model';

@Component({
  selector: 'app-perfil-paciente',
  imports: [CommonModule, ModalEditarPaciente],
  templateUrl: './perfil-paciente.html',
  styleUrl: './perfil-paciente.css'
})
export class PerfilPaciente implements OnInit {
  alergias: Alergia[] = [];
  condiciones: CondicionMedica[] = [];
  modalEditar = signal(false);

  paciente = signal<UpdatePaciente>({
    nombre: '',
    apellido1: '',
    apellido2: '',
    telefono: '',
    fecha_nacimiento: '',
    sexo: Sexo.FEMENINO,      //estos datos debo ponerles un defect pero se cargaran con la sesion
    tiene_tutor: SiONo.NO,
    tutor_nombre: '',
    tutor_apellido1: '',
    tutor_apellido2: '',
    tutor_telefono: '',
    tutor_correo: '',
    tutor_relacion: '',
    d_calle: '',
    d_num_exterior: '',
    d_colonia: '',
    d_cp: '',
    d_entidadfed: '',
    d_municipio: '',
    d_localidad: ''
  });

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

  abrirModalEditarPac() {
    this.modalEditar.set(true);
  }

  cerrarModal() {
    this.modalEditar.set(false);
  }

  actualizarPaciente(updated: UpdatePaciente) {
    this.paciente.set(updated);
    this.cerrarModal();
  }

}
