import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MisTurnosComponent } from './mis-turnos.component';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', component: MisTurnosComponent }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MisTurnosComponent
  ]
})
export class MisTurnosModule { } 