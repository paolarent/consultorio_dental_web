import { StatusArchivo } from "../shared/enums";

export interface Archivo {
    id_archivo: number;
    id_paciente: number;
    nombre: string;
    descripcion: string;
    url_imagen: string;
    imagen_public_id?: string;
    fecha_subida: string; // ISO string
    status: StatusArchivo;
}
