import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'estadoTurno',
  standalone: true
})
export class EstadoTurnoPipe implements PipeTransform {
  transform(estado: string): { texto: string; clase: string } {
    if (!estado) return { texto: 'Sin estado', clase: 'estado-sin-estado' };
    
    switch (estado.toLowerCase()) {
      case 'pendiente':
        return { texto: 'Pendiente', clase: 'estado-pendiente' };
      case 'confirmado':
        return { texto: 'Confirmado', clase: 'estado-confirmado' };
      case 'realizado':
        return { texto: 'Realizado', clase: 'estado-realizado' };
      case 'cancelado':
        return { texto: 'Cancelado', clase: 'estado-cancelado' };
      case 'reprogramado':
        return { texto: 'Reprogramado', clase: 'estado-reprogramado' };
      default:
        return { texto: estado, clase: 'estado-default' };
    }
  }
} 