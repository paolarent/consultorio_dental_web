import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CrearCitaDto } from '../models/cita.model';

@Injectable({ 
    providedIn: 'root' 
})
export class CitaService {
    private http = inject(HttpClient);
    private baseUrl = `${environment.backendUrl}/cita`;

    listarCitasCalendario(): Observable<any[]> { 
        const url = `${this.baseUrl}/calendario/citas`;
        return this.http.get<any[]>(url, { withCredentials: true });
    }

    listarMotivos(): Observable<{ id_motivo: number; nombre: string; id_servicio: number | null; }[]> 
    {
        return this.http.get<{ id_motivo: number; nombre: string; id_servicio: number | null; }[]>(`${this.baseUrl}/motivos`, { withCredentials: true });
    }

    //CREAR CITA(DENTISTA)
    crearCita(dto: CrearCitaDto): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}/crear`, dto, { withCredentials: true });
    }

}