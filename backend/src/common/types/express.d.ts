import 'express';

declare module 'express' {
    export interface Request {
        user?: {
            id_usuario: number;
            rol: string;
            id_consultorio: number;
        };
    }
}
