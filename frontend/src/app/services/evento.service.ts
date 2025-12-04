import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.prod';
import { CreateEventoDto, Evento, UpdateEventoDto } from '../models/evento.model';

@Injectable({ 
    providedIn: 'root' 
})
export class EventoService {
    private http = inject(HttpClient);
    private baseUrl = `${environment.backendUrl}/evento`;

    createEvento(data: CreateEventoDto): Observable<Evento> {
        return this.http.post<Evento>(`${this.baseUrl}`, data, { withCredentials: true });
    }

    listarTiposEvento(): Observable<{ id_tipo_evento: number; nombre: string }[]> {
            return this.http.get<{ id_tipo_evento: number; nombre: string }[]>(`${this.baseUrl}/tipos`, { withCredentials: true }
        );
    }

    listarEventosActivos() {
        return this.http.get<any[]>(`${this.baseUrl}/activos`, { withCredentials: true });
    }

    obtenerEvento(id_evento: number): Observable<Evento> {
        return this.http.get<Evento>(`${this.baseUrl}/${id_evento}`, { withCredentials: true});
    }

    actualizarEvento(id_evento: number, data: UpdateEventoDto): Observable<Evento> {
        return this.http.patch<Evento>(`${this.baseUrl}/${id_evento}`, data, { withCredentials: true });
    }

    cancelarEvento(id_evento: number): Observable<Evento> {
        return this.http.patch<Evento>(`${this.baseUrl}/${id_evento}/cancelar`, {}, { withCredentials: true });
    }

}