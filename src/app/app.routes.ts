import { Routes } from '@angular/router';
import { HomeComponent } from './componentes/home/home.component';
import { PageNotFoundComponent } from './componentes/page-not-found/page-not-found.component';
import { LoginComponent } from './componentes/login/login.component';
import { RegistroComponent } from './componentes/registro/registro.component';

export const routes: Routes = [
    { path: '', redirectTo: '/login', pathMatch: "full" },
    { path: 'home', component: HomeComponent },
    { path: 'login', component: LoginComponent },
    { path: 'registro', component: RegistroComponent },
    { path: 'usuarios', loadChildren: () => import('./componentes/usuarios/usuarios.module').then(m => m.UsuariosModule) },
    { path: 'sacarTurno', loadChildren: () => import('./componentes/sacar-turno/sacar-turno.module').then(m => m.SacarTurnoModule) },
    { path: 'miPerfil', loadChildren: () => import('./componentes/mi-perfil/mi-perfil.module').then(m => m.MiPerfilModule) },
    { path: 'misTurnos', loadChildren: () => import('./componentes/mis-turnos/mis-turnos.module').then(m => m.MisTurnosModule) },
    { path: 'turnos', loadChildren: () => import('./componentes/mis-turnos/mis-turnos.module').then(m => m.MisTurnosModule) },
    { path: 'pacientes', loadChildren: () => import('./componentes/pacientes/pacientes.module').then(m => m.PacientesModule) },
    { path: 'estadisticas', loadChildren: () => import('./componentes/estadisticas/estadisticas.module').then(m => m.EstadisticasModule) },
    { path: '**', component: PageNotFoundComponent },
];