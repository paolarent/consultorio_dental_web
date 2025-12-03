import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class IAService {
    private baseUrl = `${environment.backendUrl}/ia`;

    constructor(private http: HttpClient) {}

    generarMotivos(payload: { nombre: string; descripcion?: string; n?: number }): Observable<any> {
        return this.http.post(`${this.baseUrl}/motivos`, payload);
    }
}
