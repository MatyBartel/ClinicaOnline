import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-lista-paises',
  templateUrl: './lista-paises.component.html',
  styleUrls: ['./lista-paises.component.css'],
  imports: [CommonModule],  // Asegúrate de agregar esta línea
  standalone: true
})
export class ListaPaisesComponent {
  @Output() paisSeleccionado = new EventEmitter<string>();

  paises = [
    { nombre: 'Argentina', bandera: 'https://firebasestorage.googleapis.com/v0/b/pp-labo-iv----bartel.appspot.com/o/bandeArg.jpg?alt=media&token=c5a200e4-6a92-45d1-8d51-778baa71435f' },
    { nombre: 'Brasil', bandera: 'https://firebasestorage.googleapis.com/v0/b/pp-labo-iv----bartel.appspot.com/o/bandeBra.jpg?alt=media&token=e7609e51-4398-458f-a2a4-749b1e7ebc3e' },
    { nombre: 'España', bandera: 'https://firebasestorage.googleapis.com/v0/b/pp-labo-iv----bartel.appspot.com/o/bandeEsp.png?alt=media&token=a7687c91-9523-43c0-9a2a-239a19346aae' },
  ];

  seleccionarPais(pais: { nombre: string }): void {
    this.paisSeleccionado.emit(pais.nombre);
  }
}