import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateEgresoDto } from '../models/egreso.model';

@Injectable({
    providedIn: 'root'
})
export class EgresoService {
    private http = inject(HttpClient);
    private baseUrl = 'http://localhost:3000/egreso'; //ruta al back

    listarTiposEgreso(): Observable<{ id_tipo_egreso: number; nombre: string }[]> {
            return this.http.get<{ id_tipo_egreso: number; nombre: string }[]>(`${this.baseUrl}/tipos`, { withCredentials: true }
        );
    }

    crearEgreso(dto: CreateEgresoDto): Observable<any> {
        return this.http.post<any>(this.baseUrl, dto, { withCredentials: true });
    }
}