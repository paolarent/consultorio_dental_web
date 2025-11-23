import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Alergia } from '../models/get-alergia.model';


@Injectable({
    providedIn: 'root'
})
export class AlergiasService {
    private http = inject(HttpClient);
    private baseUrl = 'http://localhost:3000/alergias'; //ruta al back

    listarAlergiasPaciente(idPaciente?: number): Observable<Alergia[]> {
        if (idPaciente) {
            return this.http.get<Alergia[]>(`${this.baseUrl}/mis-alergias?idPaciente=${idPaciente}`, { withCredentials: true });
        }
        return this.http.get<Alergia[]>(`${this.baseUrl}/mis-alergias`, { withCredentials: true });
    }

    agregarAlergia(dto: any): Observable<Alergia> {
        return this.http.post<Alergia>(`${this.baseUrl}`, dto, { withCredentials: true });
    }

    listarTiposAlergia(): Observable<{ id_tipo_alergia: number; nombre: string }[]> {
        return this.http.get<{ id_tipo_alergia: number; nombre: string }[]>(`${this.baseUrl}/tipos`, { withCredentials: true }
        );
    }

    desactivarAlergia(id_alergia: number): Observable<any> {
        return this.http.patch(`${this.baseUrl}/desactivar/${id_alergia}`, {}, { withCredentials: true });
    }
}
