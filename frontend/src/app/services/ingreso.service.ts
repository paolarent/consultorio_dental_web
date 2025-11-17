import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class IngresoService {
    private http = inject(HttpClient);
    private baseUrl = 'http://localhost:3000/ingresos'; //ruta al back

    // OBTENER CORTE ABIERTO
    obtenerCorteAbierto(): Observable<any> {
        return this.http.get(`${this.baseUrl}/corte/abierto`, { withCredentials: true });
    }

    // ABRIR CORTE DE CAJA
    abrirCorte(dto: { monto_apertura: number }): Observable<any> {
        return this.http.post(`${this.baseUrl}/corte/abrir`, dto, { withCredentials: true });
    }

    // CERRAR CORTE DE CAJA
    cerrarCorte(): Observable<any> {
        return this.http.post(`${this.baseUrl}/corte/cerrar`, {}, { withCredentials: true });
    }
}