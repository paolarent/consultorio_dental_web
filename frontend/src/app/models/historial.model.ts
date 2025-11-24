interface Fotografia {
    id_foto: number;
    url_fotografia: string;
}

interface Historial {
    id_historial: number;
    id_servicio: number;
    fecha: string;
    descripcion: string;
    fotografia_historial: Fotografia[];
    servicio: { id_servicio: number; nombre: string };
}

interface ArchivoPreview {
    file: File | null; // null si ya está en backend
    preview: string;
    index?: number;
    id_foto?: number; // fotos que ya existen en backend
}

