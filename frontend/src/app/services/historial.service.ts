import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HistorialService {

    private baseUrl = 'http://localhost:3000/historial-tratamientos';

    constructor(private http: HttpClient) {}

    listarHistorial(id_paciente: number): Observable<any> {
        return this.http.get(`${this.baseUrl}/${id_paciente}`, { withCredentials: true });
    }

    registrarTratamiento(formData: FormData): Observable<any> {
        return this.http.post(`${this.baseUrl}`, formData, { withCredentials: true });
    }

}
