import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment.prod';

@Injectable({ providedIn: 'root' })
export class HorarioService {
    private http = inject(HttpClient);

    //private baseUrl = 'http://localhost:3000/horario';
    private baseUrl = `${environment.backendUrl}/horario`;

    obtenerHorario() {
        return this.http.get<any[]>(this.baseUrl, { withCredentials: true }); 
    }

    updateHorario(payload: any[]) {
        return this.http.post(`${this.baseUrl}/sync`, payload, { withCredentials: true });
    }

}
