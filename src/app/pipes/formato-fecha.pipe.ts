import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatoFecha',
  standalone: true
})
export class FormatoFechaPipe implements PipeTransform {
  transform(value: any, formato: string = 'completo'): string {
    if (!value) return 'N/A';
    
    let fecha: Date;
    
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2} \(.+\)$/.test(value)) {
      value = value.split(' ')[0];
    }
    if (value.seconds) {
      fecha = new Date(value.seconds * 1000);
    } else if (value instanceof Date) {
      fecha = value;
    } else if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [anio, mes, dia] = value.split('-').map(Number);
      fecha = new Date(anio, mes - 1, dia);
    } else {
      fecha = new Date(value);
    }
    
    if (isNaN(fecha.getTime())) return 'Fecha inválida';
    
    switch (formato) {
      case 'corta':
        return fecha.toLocaleDateString('es-ES');
      case 'hora':
        return fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      case 'dia':
        return fecha.toLocaleDateString('es-ES', { weekday: 'long' });
      case 'mes':
        return fecha.toLocaleDateString('es-ES', { month: 'long' });
      case 'completo':
        return fecha.toLocaleString('es-ES', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      case 'customDiaMesAnioDia':
        const dia = fecha.getDate().toString().padStart(2, '0');
        const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
        const anio = fecha.getFullYear();
        const diaSemana = fecha.toLocaleDateString('es-ES', { weekday: 'long' });
        return `${dia}/${mes}/${anio} (${diaSemana})`;
      default:
        return 'Formato no válido';
    }
  }
} 