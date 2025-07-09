import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EstadisticasComponent } from './estadisticas.component';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', component: EstadisticasComponent }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    EstadisticasComponent
  ]
})
export class EstadisticasModule { } 