import { Sexo, SiONo, Status } from '../../../../backend/src/common/enums/index';

export interface UpdatePaciente {
    nombre?: string;
    apellido1?: string;
    apellido2?: string;
    telefono?: string;
    fecha_nacimiento?: string;
    sexo?: Sexo;

    d_calle?: string;
    d_num_exterior?: string;
    d_colonia?: string;
    d_cp?: string;
    d_entidadfed?: string;
    d_municipio?: string;
    d_localidad?: string;

    tiene_tutor?: SiONo;
    tutor_nombre?: string;
    tutor_apellido1?: string;
    tutor_apellido2?: string;
    tutor_telefono?: string;
    tutor_correo?: string;
    tutor_relacion?: string;

    status?: Status;
}
