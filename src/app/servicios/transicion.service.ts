import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface TransicionConfig {
  tipoUsuario: 'especialista' | 'paciente' | 'admin';
  mensaje: string;
  duracion?: number;
}

@Injectable({
  providedIn: 'root'
})
export class TransicionService {
  private _mostrarTransicion = new BehaviorSubject<boolean>(false);
  private _configuracionTransicion = new BehaviorSubject<TransicionConfig>({
    tipoUsuario: 'paciente',
    mensaje: 'Cargando...'
  });

  mostrarTransicion$ = this._mostrarTransicion.asObservable();
  configuracionTransicion$ = this._configuracionTransicion.asObservable();

  mostrarTransicion(config: TransicionConfig) {
    this._configuracionTransicion.next(config);
    this._mostrarTransicion.next(true);
  }

  ocultarTransicion() {
    this._mostrarTransicion.next(false);
  }

  transicionConDuracion(config: TransicionConfig, duracion: number = 2000) {
    this.mostrarTransicion(config);
    setTimeout(() => {
      this.ocultarTransicion();
    }, duracion);
  }
} 