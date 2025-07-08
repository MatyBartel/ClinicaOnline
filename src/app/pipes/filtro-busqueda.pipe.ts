import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filtroBusqueda',
  standalone: true
})
export class FiltroBusquedaPipe implements PipeTransform {
  transform(items: any[], terminoBusqueda: string, campos: string[] = []): any[] {
    if (!items || !terminoBusqueda || terminoBusqueda.trim() === '') {
      return items;
    }
    
    const termino = terminoBusqueda.toLowerCase().trim();
    
    return items.filter(item => {
      if (campos.length > 0) {
        return campos.some(campo => {
          const valor = this.obtenerValorCampo(item, campo);
          return valor && valor.toString().toLowerCase().includes(termino);
        });
      }
      
      return Object.values(item).some(valor => {
        if (valor && typeof valor === 'string') {
          return valor.toLowerCase().includes(termino);
        }
        if (valor && typeof valor === 'number') {
          return valor.toString().includes(termino);
        }
        return false;
      });
    });
  }
  
  private obtenerValorCampo(item: any, campo: string): any {
    const campos = campo.split('.');
    let valor = item;
    
    for (const c of campos) {
      if (valor && typeof valor === 'object' && c in valor) {
        valor = valor[c];
      } else {
        return null;
      }
    }
    
    return valor;
  }
} 