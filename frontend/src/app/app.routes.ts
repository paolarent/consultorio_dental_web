import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { FormLogin } from './components/form-login/form-login';
import { FormLoginPaciente } from './components/form-login-paciente/form-login-paciente';

export const routes: Routes = [
    { 
        path: 'login', 
        component: Login, // layout/page
        children: [
            { path: 'paciente', component: FormLoginPaciente },
            { path: '', component: FormLogin }
        ]
    }
];
