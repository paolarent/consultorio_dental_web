import { Sexo, SiONo, Status } from '../../../../backend/src/common/enums/index';

export interface Paciente {
    id_paciente: number;
    nombre: string;
    apellido1: string;
    apellido2: string;
    telefono: string;
    fecha_nacimiento: string;
    sexo: Sexo;

    d_calle: string;
    d_num_exterior: string;
    d_colonia: string;
    d_cp: string;
    d_entidadfed: string;
    d_municipio: string;
    d_localidad: string;

    tiene_tutor: SiONo;
    tutor_nombre: string | null;
    tutor_apellido1: string | null;
    tutor_apellido2: string | null;
    tutor_telefono: string | null;
    tutor_correo: string | null;
    tutor_relacion: string | null;
}


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
    tutor_nombre?: string | null;
    tutor_apellido1?: string | null;
    tutor_apellido2?: string |null;
    tutor_telefono?: string | null;
    tutor_correo?: string | null;
    tutor_relacion?: string | null;
    //status?: Status;
}
