import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Archivo } from '../models/archivo.model';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ArchivoService {
    private http = inject(HttpClient);
    //private baseUrl = 'http://localhost:3000/archivo'; 
    private baseUrl = `${environment.backendUrl}/archivo`;

    //Para obtener archivos de un paciente
    obtenerArchivos(id_paciente: number): Observable<Archivo[]> {
        return this.http.get<Archivo[]>(`${this.baseUrl}/paciente/${id_paciente}`, { withCredentials: true });
    }

    subirArchivo(idPaciente: number, data: FormData): Observable<Archivo> {
        return this.http.post<Archivo>(`${this.baseUrl}/paciente/${idPaciente}`, data, { withCredentials: true });
    }

    actualizarArchivo(id_archivo: number, formData: FormData): Observable<Archivo> {
        return this.http.patch<Archivo>(`${this.baseUrl}/update/${id_archivo}`, formData, { withCredentials: true });
    }

    ocultarArchivo(id_historial: number) {
        return this.http.patch(`${this.baseUrl}/ocultar/${id_historial}`, {}, { withCredentials: true });
    }

}
