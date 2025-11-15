import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ServicioService {
    private http = inject(HttpClient);
    private baseUrl = 'http://localhost:3000/servicio';

    findAllActive(id_consultorio: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/activo`, {
        params: { id_consultorio: id_consultorio.toString() },
        withCredentials: true
        });
    }

}


