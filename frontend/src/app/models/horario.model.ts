interface DiaHorarioUI {
    id?: number;             // id_horario en BD (para updates)
    dia: number;             // 1..7
    nombre: string;
    activo: boolean;

    // Turno principal
    hora_inicio: string | null;
    hora_fin: string | null;

    // Segundo turno
    segundoTurno: boolean;
    turno2_inicio: string | null;
    turno2_fin: string | null;

    // Para saber si este turno existe en la BD :)
    id_turno2?: number;
}