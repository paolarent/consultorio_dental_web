import { provideRouter, Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { FormLogin } from './components/form-login/form-login';
import { FormLoginPaciente } from './components/form-login-paciente/form-login-paciente';
import { FormRestorePassw } from './components/form-restore-passw/form-restore-passw';
import { FormNewPassw } from './components/form-new-passw/form-new-passw';
import { Home } from './pages/home/home';
import { AuthGuard } from './auth/auth.guard';
import { HomeDoc } from './pages/home-doc/home-doc';
import { LandingPage } from './components/landing-page/landing-page';
import { CitasPaciente } from './components/citas-paciente/citas-paciente';
import { AdeudosPaciente } from './components/adeudos-paciente/adeudos-paciente';
import { PerfilPaciente } from './components/perfil-paciente/perfil-paciente';
import { AgendaDoc } from './components/agenda-doc/agenda-doc';
import { Pacientes } from './components/pacientes/pacientes';
import { Servicios } from './components/servicios/servicios';
import { Finanzas } from './components/finanzas/finanzas';
import { Eventos } from './components/eventos/eventos';
import { Expediente } from './components/expediente/expediente';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'  // muy importante
    },

    {
        path: 'login', 
        component: Login, // layout/page
        children: [
            { path: '', component: FormLogin },
            { path: 'paciente', component: FormLoginPaciente },
            { path: 'forgot-password', component: FormRestorePassw },
            { path: 'restore-password', component: FormNewPassw }
        ]
    },

    {
        path: 'home',
        component: Home,
        canActivate: [AuthGuard],
        children: [
            { path: '', component: LandingPage },  //vista principal
            { path: 'citas', component: CitasPaciente },
            { path: 'mis-adeudos', component: AdeudosPaciente },
            { path: 'mi-perfil', component: PerfilPaciente }
        ]
    },

    {
        path: 'doc',
        component: HomeDoc,
        canActivate: [AuthGuard],
        children: [
            { path: '', redirectTo: 'mi-agenda/citas', pathMatch: 'full' }, // redirección automática
            { path: 'mi-agenda/citas', component: AgendaDoc },
            { path: 'mi-agenda/eventos', component: Eventos },
            { path: 'pacientes',
                children: [
                    { path: '', component: Pacientes }, 
                    { path: 'expediente/:id', component: Expediente },
                ]
            },
            { path: 'servicios', component: Servicios },
            { path: 'finanzas', component: Finanzas }
        ]
    },
    
    {
        path: '**',
        redirectTo: 'login' // cualquier ruta inválida también va a login
    }
    
];

export const appRouterProviders = [
    provideRouter(routes)
];
