import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CrearCitaDto, ResponderReprogramacionDto, SolicitarCitaDto } from '../models/cita.model';

@Injectable({ 
    providedIn: 'root' 
})
export class CitaService {
    private http = inject(HttpClient);
    private baseUrl = `${environment.backendUrl}/cita`;

    /*listarCitasCalendario(): Observable<any[]> { 
        const url = `${this.baseUrl}/calendario/citas`;
        return this.http.get<any[]>(url, { withCredentials: true });
    }*/
    listarCitasCalendario(soloCalendario: boolean = false): Observable<any[]> { 
        const url = `${this.baseUrl}/calendario/citas?soloCalendario=${soloCalendario}`;
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

    //SOLICITAR CITA (PACIENTE)
    solicitarCita(dto: SolicitarCitaDto): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}/solicitar`, dto, { withCredentials: true });
    }

    listarCitasDentista(status?: string, fecha?: string) {
        let params: any = {};

        if (status) params.status = status;
        if (fecha) params.fecha = fecha;

        return this.http.get<any[]>(`${this.baseUrl}/dentista/mis-citas`, {
            params,
            withCredentials: true
        });
    }

    listarCitasPaciente(status?: string, fecha?: string) {
        const params: any = {};
        if (status) params.status = status;
        if (fecha) params.fecha = fecha;

        return this.http.get<any[]>(`${this.baseUrl}/paciente/mis-citas`, {
            params,
            withCredentials: true
        });
    }

    // Cancelar cita
    cancelarCita(id: number): Observable<any> {
        return this.http.patch<any>(`${this.baseUrl}/${id}/cancelar`, {}, { withCredentials: true });
    }

    // Marcar cita como completada
    marcarCitaCompletada(id: number): Observable<any> {
        return this.http.patch<any>(`${this.baseUrl}/${id}/completar`, {}, { withCredentials: true });
    }

    // Actualizar status a programada
    actualizarStatusCita(id: number, status: 'programada'): Observable<any> {
        return this.http.patch<any>(`${this.baseUrl}/${id}/actualizar-status`, { status }, { withCredentials: true });
    }

    //SOLICITUD DE REPROGRAMACION
    solicitarReprogramacion(id_cita: number, nueva_fecha: string, nueva_hora: string) {
        const body = {id_cita, nueva_fecha, nueva_hora };
        return this.http.post(`${this.baseUrl}/reprogramar`, body, { withCredentials: true });
    }

    // Responder reprogramación (aceptar o rechazar)
    responderReprogramacion(idReprogramacion: number, dto: ResponderReprogramacionDto): Observable<any> {
        return this.http.patch(`${this.baseUrl}/reprogramacion/${idReprogramacion}/responder`, dto, { withCredentials: true });
    }
}