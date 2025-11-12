import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Alergia } from '../models/get-alergia.model';


@Injectable({
    providedIn: 'root'
})
export class AlergiasService {
    private http = inject(HttpClient);
    private baseUrl = 'http://localhost:3000/alergias'; //ruta al back

    listarAlergiasPaciente(): Observable<Alergia[]> {
        return this.http.get<Alergia[]>(`${this.baseUrl}/mis-alergias`, { withCredentials: true });
    }
}
