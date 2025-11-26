import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Servicio } from '../models/servicio';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ServicioService {
    private http = inject(HttpClient);
    //private baseUrl = 'http://localhost:3000/servicio';
    private baseUrl = `${environment.backendUrl}/servicio`;

    findAllActive(id_consultorio: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/activo`, {
        params: { id_consultorio: id_consultorio.toString() },
        withCredentials: true
        });
    }

    createServicio(formData: FormData): Observable<Servicio> {
        return this.http.post<Servicio>(this.baseUrl, formData, { withCredentials: true });
    }

    updateServicio(id: number, formData: FormData): Observable<Servicio> {
        return this.http.patch<Servicio>(`${this.baseUrl}/${id}`, formData, { withCredentials: true });
    }

    softDelete(id: number) {
        return this.http.patch(`${this.baseUrl}/soft-delete/${id}`, {}, { withCredentials: true });
    }

    listarServicios(): Observable<{ 
        id_servicio: number; 
        nombre: string; 
        precio_base: number; 
        tipo_cobro?: string 
    }[]> {
        return this.http.get<{ id_servicio: number; nombre: string; precio_base: number; tipo_cobro?: string }[]>(`${this.baseUrl}/tipos`, { withCredentials: true });
    }


}


