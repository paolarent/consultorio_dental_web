import { provideRouter, Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { FormLogin } from './components/form-login/form-login';
import { FormLoginPaciente } from './components/form-login-paciente/form-login-paciente';
import { FormRestorePassw } from './components/form-restore-passw/form-restore-passw';
import { FormNewPassw } from './components/form-new-passw/form-new-passw';
import { Home } from './pages/home/home';
import { AuthGuard } from './auth/auth.guard';

export const routes: Routes = [
    { 
        path: 'login', 
        component: Login, // layout/page
        children: [
            { path: 'paciente', component: FormLoginPaciente },
            { path: '', component: FormLogin },
            { path: 'forgot-password', component: FormRestorePassw },
            { path: 'restore-password', component: FormNewPassw }
        ]
    },

    {
        path: '',
        component: Home,
        //canActivate: [AuthGuard]
        /*
        children: [
            { path: 'paciente', component: FormLoginPaciente },
            { path: '', component: FormLogin },
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
