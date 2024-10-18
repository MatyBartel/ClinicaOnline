import { Routes } from '@angular/router';
import { AltaChoferComponent } from './componentes/altaChofer/altaChofer.component';
import { HomeComponent } from './componentes/home/home.component';
import { PageNotFoundComponent } from './componentes/page-not-found/page-not-found.component';



export const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: "full" },
    { path: 'home', component: HomeComponent },
    { path: 'altaChofer', component: AltaChoferComponent },

    { path: '**', component: PageNotFoundComponent },
];