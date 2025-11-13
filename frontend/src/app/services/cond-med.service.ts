import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CondicionMedica } from '../models/get-condmed.model';

@Injectable({
    providedIn: 'root'
})
export class CondicionesMedicasService {
    private http = inject(HttpClient);
    private baseUrl = 'http://localhost:3000/condiciones-medicas'; //ruta backend

    listarCMPaciente(): Observable<CondicionMedica[]> {
        return this.http.get<CondicionMedica[]>(`${this.baseUrl}/mis-condiciones-medicas`, { withCredentials: true });
    }

    agregarCondicion(dto: any): Observable<CondicionMedica> {
        return this.http.post<CondicionMedica>(`${this.baseUrl}`, dto, { withCredentials: true });
    }


    listarTiposCondiciones(): Observable<{ id_tipo_condicion: number; nombre: string }[]> {
        return this.http.get<{ id_tipo_condicion: number; nombre: string }[]>(`${this.baseUrl}/tipos`, { withCredentials: true });
    }

    desactivarCondicion(id_condicion_medica: number): Observable<any> {
        return this.http.patch<void>(`${this.baseUrl}/descartar/${id_condicion_medica}`, {}, { withCredentials: true });
    }


}
