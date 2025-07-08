import { Injectable } from '@angular/core';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class LogService {

  constructor() { }

  async registrarIngreso(usuario: string, tipoUsuario: string) {
    try {
      const db = getFirestore();
      const logData = {
        usuario: usuario,
        tipoUsuario: tipoUsuario,
        fecha: serverTimestamp(),
        hora: new Date().toLocaleTimeString('es-ES'),
        ip: await this.obtenerIP(),
        userAgent: navigator.userAgent
      };
      
      await addDoc(collection(db, 'logIngresos'), logData);
    } catch (error) {
      console.error('Error registrando ingreso:', error);
    }
  }

  private async obtenerIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'No disponible';
    }
  }
} 