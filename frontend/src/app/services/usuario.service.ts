import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UpdateCorreo } from '../models/update-correo.model';
import { UpdateContrasena } from '../models/update-contra.model';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
    private http = inject(HttpClient);
    private baseUrl = 'http://localhost:3000/usuario';

    //Solicitar actualización de correo
    correoUpdateRequest(id: number, newCorreo: string) {
        return this.http.patch<UpdateCorreo>(`${this.baseUrl}/${id}/correo/request`, { correo: newCorreo }, { withCredentials: true });
    }

    //CAMBIAR CONTRASEÑA
    updateContrasena(actual: string, nueva: string, confirmar: string) {
        return this.http.patch<UpdateContrasena>(`${this.baseUrl}/cambiar-contrasena`, { actual, nueva, confirmar }, { withCredentials: true });
    }

}