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

    // CREAR INGRESO
    crearIngreso(dto: any): Observable<any> {
        return this.http.post(`${this.baseUrl}`, dto, { withCredentials: true });
    }

    listarMetodosPago(): Observable<{ id_metodo_pago: number; nombre: string }[]> {
            return this.http.get<{ id_metodo_pago: number; nombre: string }[]>(`${this.baseUrl}/formas-de-pago`, { withCredentials: true }
        );
    }

    totalIngresos(): Observable<{ total: number }> {
        return this.http.get<{ total: number }>(`${this.baseUrl}/total`, { withCredentials: true } // necesario si para las cookies para auth
        );
    }

    totalIngresosMes(): Observable<{ total: number }> {
        return this.http.get<{ total: number }>(`${this.baseUrl}/total-mes`, { withCredentials: true });
    }

    historialFinanzas(): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/historial`, { withCredentials: true });
    }

}