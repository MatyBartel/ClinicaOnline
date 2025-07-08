import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Firestore, collection, collectionData, query, where } from '@angular/fire/firestore';
import { getAuth } from 'firebase/auth';
import { FormatoFechaPipe } from '../../pipes/formato-fecha.pipe';

@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [CommonModule, FormatoFechaPipe],
  templateUrl: './pacientes.component.html',
  styleUrl: './pacientes.component.css'
})
export class PacientesComponent implements OnInit {
  firestore: Firestore = inject(Firestore);
  uid: string = '';
  pacientesAtendidos: any[] = [];
  pacienteSeleccionado: any = null;
  historiaClinica: any[] = [];
  cargando: boolean = true;

  async ngOnInit() {
    const user = getAuth().currentUser;
    if (user) {
      this.uid = user.uid;
      await this.cargarPacientesAtendidos();
    }
  }

  async cargarPacientesAtendidos() {
    this.cargando = true;
    const turnosRef = collection(this.firestore, 'Turnos');
    const q = query(turnosRef, where('especialistaId', '==', this.uid), where('estado', '==', 'realizado'));
    collectionData(q, { idField: 'id' }).subscribe((turnos: any[]) => {
      const pacientesMap: { [key: string]: any } = {};
      turnos.forEach(turno => {
        if (!pacientesMap[turno.pacienteId]) {
          pacientesMap[turno.pacienteId] = {
            pacienteId: turno.pacienteId,
            pacienteNombre: turno.pacienteNombre,
            pacienteApellido: turno.pacienteApellido,
            pacienteImagen: turno.pacienteImagen || '',
            turnos: []
          };
        }
        pacientesMap[turno.pacienteId].turnos.push(turno);
      });
      
      Object.values(pacientesMap).forEach((paciente: any) => {
        const turnosOrdenados = [...paciente.turnos].sort((a, b) => {
          const fechaA = new Date(a.FechaTurno + ' ' + a.HorarioTurno).getTime();
          const fechaB = new Date(b.FechaTurno + ' ' + b.HorarioTurno).getTime();
          return fechaB - fechaA;
        });
        
        paciente.ultimosTurnos = turnosOrdenados.slice(0, 3);
      });
      
      this.pacientesAtendidos = Object.values(pacientesMap);
      this.cargando = false;
    });
  }

  verHistoriaClinica(paciente: any) {
    this.pacienteSeleccionado = paciente;
    this.historiaClinica = [...paciente.turnos].sort((a, b) => {
      const fechaA = new Date(a.FechaTurno + ' ' + a.HorarioTurno).getTime();
      const fechaB = new Date(b.FechaTurno + ' ' + b.HorarioTurno).getTime();
      return fechaB - fechaA;
    });
  }

  cerrarHistoriaClinica() {
    this.pacienteSeleccionado = null;
    this.historiaClinica = [];
  }
}
