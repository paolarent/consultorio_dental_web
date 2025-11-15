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

export const routes: Routes = [
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
        canActivate: [AuthGuard]
        /*
        children: [
            { path: 'mi-agenda', component: FormLoginPaciente },
            { path: 'finanzas', component: FormLogin },
            { path: 'forgot-password', component: FormRestorePassw },
            { path: 'restore-password', component: FormNewPassw }
        ]
        */
    },
    
    {
        path: '**',
        redirectTo: '' // fallback
    }
    
];

export const appRouterProviders = [
    provideRouter(routes)
];
