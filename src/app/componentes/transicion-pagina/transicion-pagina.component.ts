import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-transicion-pagina',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './transicion-pagina.component.html',
  styleUrl: './transicion-pagina.component.scss'
})
export class TransicionPaginaComponent implements OnInit {
  @Input() tipoUsuario: 'especialista' | 'paciente' | 'admin' = 'paciente';
  @Input() mensaje: string = 'Cargando...';
  
  mostrarTransicion = false;
  claseAnimacion = '';

  ngOnInit() {
    this.mostrarTransicion = true;
    this.claseAnimacion = `animacion-${this.tipoUsuario}`;
  }
} 