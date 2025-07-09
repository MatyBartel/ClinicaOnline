import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MiPerfilComponent } from './mi-perfil.component';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', component: MiPerfilComponent }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MiPerfilComponent
  ]
})
export class MiPerfilModule { } 