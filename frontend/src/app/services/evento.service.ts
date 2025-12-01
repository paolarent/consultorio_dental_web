import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ 
    providedIn: 'root' 
})
export class EventoService {
    private http = inject(HttpClient);
    private baseUrl = `${environment.backendUrl}/evento`;

    listarTiposEvento(): Observable<{ id_tipo_evento: number; nombre: string }[]> {
            return this.http.get<{ id_tipo_evento: number; nombre: string }[]>(`${this.baseUrl}/tipos`, { withCredentials: true }
        );
    }
}