import { Routes } from '@angular/router';
import { HomeComponent } from './componentes/home/home.component';
import { PageNotFoundComponent } from './componentes/page-not-found/page-not-found.component';
import { LoginComponent } from './componentes/login/login.component';
import { RegistroComponent } from './componentes/registro/registro.component';
import { UsuariosComponent } from './componentes/usuarios/usuarios.component';
import { SacarTurnoComponent } from './componentes/sacar-turno/sacar-turno.component';
import { MiPerfilComponent } from './componentes/mi-perfil/mi-perfil.component';
import { MisTurnosComponent } from './componentes/mis-turnos/mis-turnos.component';
import { PacientesComponent } from './componentes/pacientes/pacientes.component';



export const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: "full" },
    { path: 'home', component: HomeComponent },
    { path: 'login', component: LoginComponent },
    { path: 'registro', component: RegistroComponent },
    { path: 'usuarios', component: UsuariosComponent },
    { path: 'sacarTurno', component: SacarTurnoComponent },
    { path: 'miPerfil', component: MiPerfilComponent },
    { path: 'misTurnos', component: MisTurnosComponent },
    { path: 'turnos', component: MisTurnosComponent },
    { path: 'pacientes', component: PacientesComponent },

    { path: '**', component: PageNotFoundComponent },
];