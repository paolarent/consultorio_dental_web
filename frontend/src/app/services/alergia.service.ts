import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Alergia {
    id_alergia: number;
    nombre: string;
    notas: string;
    severidad: string;
}

@Injectable({
    providedIn: 'root'
})
export class AlergiasService {
    private http = inject(HttpClient);
    private baseUrl = 'http://localhost:3000/alergias'; //ruta al back

    listarAlergiasPaciente(): Observable<Alergia[]> {
        return this.http.get<Alergia[]>(`${this.baseUrl}/mis-alergias`, { withCredentials: true });
    }
}
