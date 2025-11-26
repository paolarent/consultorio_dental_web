import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class HistorialService {

    //private baseUrl = 'http://localhost:3000/historial-tratamientos';
    private baseUrl = `${environment.backendUrl}/historial-tratamientos`;

    constructor(private http: HttpClient) {}

    listarHistorial(id_paciente: number): Observable<any> {
        return this.http.get(`${this.baseUrl}/${id_paciente}`, { withCredentials: true });
    }

    registrarTratamiento(formData: FormData): Observable<any> {
        return this.http.post(`${this.baseUrl}`, formData, { withCredentials: true });
    }

    actualizarTratamiento(id_historial: number, formData: FormData): Observable<any> {
        return this.http.patch(`${this.baseUrl}/update/${id_historial}`, formData, { withCredentials: true });
    }

    eliminarFoto(id_foto: number): Observable<any> {
        return this.http.patch(`${this.baseUrl}/foto/delete/${id_foto}`, {}, { withCredentials: true });
    }

    // Función para desactivar historial
    desactivarHistorial(id_historial: number) {
        return this.http.patch(`${this.baseUrl}/delete/${id_historial}`, {}, { withCredentials: true });
    }
}
