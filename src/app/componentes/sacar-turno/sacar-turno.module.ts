import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SacarTurnoComponent } from './sacar-turno.component';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', component: SacarTurnoComponent }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SacarTurnoComponent
  ]
})
export class SacarTurnoModule { } 