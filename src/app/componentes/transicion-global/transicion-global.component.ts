import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransicionService } from '../../servicios/transicion.service';
import { TransicionPaginaComponent } from '../transicion-pagina/transicion-pagina.component';

@Component({
  selector: 'app-transicion-global',
  standalone: true,
  imports: [CommonModule, TransicionPaginaComponent],
  templateUrl: './transicion-global.component.html',
  styleUrl: './transicion-global.component.scss'
})
export class TransicionGlobalComponent implements OnInit {
  mostrarTransicion = false;
  configuracion: any = {
    tipoUsuario: 'paciente',
    mensaje: 'Cargando...'
  };

  constructor(private transicionService: TransicionService) {}

  ngOnInit() {
    this.transicionService.mostrarTransicion$.subscribe(mostrar => {
      this.mostrarTransicion = mostrar;
    });

    this.transicionService.configuracionTransicion$.subscribe(config => {
      this.configuracion = config;
    });
  }
} 