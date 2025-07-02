import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Firestore, collection, collectionData, query, where, getDocs, addDoc, doc, getDoc } from '@angular/fire/firestore'; // <-- modular
import { map } from 'rxjs/operators';
import { getAuth } from 'firebase/auth';

interface Especialista {
  id: string;
  nombre: string;
  apellido: string;
  especialidad: string;
  correo: string;
}

interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  edad: number;
}

@Component({
  selector: 'app-sacar-turno',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './sacar-turno.component.html',
  styleUrl: './sacar-turno.component.css'
})
export class SacarTurnoComponent implements OnInit {
  turnoForm!: FormGroup;
  especialidades: string[] = [];
  especialistas: Especialista[] = [];
  especialistasFiltrados: Especialista[] = [];
  esAdmin = false;
  pacientes: Paciente[] = [];

  diasDisponibles: string[] = [];
  horasDisponibles: string[] = [];
  horariosEspecialista: any[] = [];

  mensajeExito: string = '';

  private firestore: Firestore = inject(Firestore);

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.turnoForm = this.fb.group({
      especialidad: ['', Validators.required],
      especialista: ['', Validators.required],
      dia: ['', Validators.required],
      hora: ['', Validators.required],
      paciente: ['']
    });

    const especialistasRef = collection(this.firestore, 'especialistas');
    collectionData(especialistasRef, { idField: 'id' }).subscribe((especialistas: any) => {
      this.especialistas = especialistas;
      this.especialidades = Array.from(new Set(especialistas.map((e: Especialista) => e.especialidad)));
    });

    if (this.esAdmin) {
      const pacientesRef = collection(this.firestore, 'pacientes');
      collectionData(pacientesRef, { idField: 'id' }).subscribe((pacientes: any) => {
        this.pacientes = pacientes;
      });
    }
  }

  async onEspecialidadChange() {
    const especialidad = this.turnoForm.value.especialidad;
    this.especialistasFiltrados = this.especialistas.filter(e =>
      e.especialidad === especialidad ||
      (Array.isArray((e as any).especialidades) && (e as any).especialidades.includes(especialidad))
    );
    this.turnoForm.patchValue({ especialista: '' });
    this.diasDisponibles = [];
    this.horasDisponibles = [];
    this.horariosEspecialista = [];
  }

  async onEspecialistaChange() {
    const especialistaId = this.turnoForm.value.especialista;
    const especialidad = this.turnoForm.value.especialidad;
    if (!especialistaId || !especialidad) return;
    const horariosRef = collection(this.firestore, 'Horarios');
    const q = query(horariosRef, where('especialistaId', '==', especialistaId), where('especialidad', '==', especialidad));
    const snapshot = await getDocs(q);
    this.horariosEspecialista = snapshot.docs.map(doc => doc.data());
    this.diasDisponibles = this.getDiasDisponiblesProximos15();
    this.turnoForm.patchValue({ dia: '', hora: '' });
    this.horasDisponibles = [];
  }

  async onDiaChange() {
    const diaSeleccionado = this.turnoForm.value.dia;
    const match = /^(\d{4}-\d{2}-\d{2}) \(([^)]+)\)$/.exec(diaSeleccionado);
    const fechaStr = match ? match[1] : '';
    const nombreDia = match ? match[2] : '';

    let horas = this.horariosEspecialista
      .filter(h => h.dia === nombreDia)
      .map(h => h.hora);

    const hoy = new Date();
    const fechaSeleccionada = new Date(fechaStr);
    if (
      fechaStr &&
      hoy.toISOString().slice(0, 10) === fechaStr
    ) {
      const horaActual = hoy.getHours() + hoy.getMinutes() / 60;
      horas = horas.filter(hora => {
        const [h, m] = hora.split(':').map(Number);
        const horaNum = h + m / 60;
        return horaNum > horaActual;
      });
    }

    const especialistaId = this.turnoForm.value.especialista;
    if (especialistaId && fechaStr) {
      const turnosRef = collection(this.firestore, 'Turnos');
      const q = query(
        turnosRef,
        where('especialistaId', '==', especialistaId),
        where('FechaTurno', '==', fechaStr),
        where('estado', 'in', ['pendiente', 'confirmado'])
      );
      const snapshot = await getDocs(q);
      const horariosReservados = snapshot.docs.map(doc => doc.data()['HorarioTurno']);
      horas = horas.filter(hora => !horariosReservados.includes(hora));
    }

    this.horasDisponibles = horas;
    this.turnoForm.patchValue({ hora: '' });
  }

  getDiasDisponiblesProximos15(): string[] {
    if (!this.horariosEspecialista.length) return [];
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const diasDisponiblesSemana = Array.from(new Set(this.horariosEspecialista.map(h => h.dia)));
    const hoy = new Date();
    const dias: string[] = [];
    for (let i = 0; i < 15; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + i);
      const nombreDia = diasSemana[fecha.getDay()];
      if (diasDisponiblesSemana.includes(nombreDia)) {
        const fechaStr = fecha.toISOString().slice(0, 10) + ' (' + nombreDia + ')';
        dias.push(fechaStr);
      }
    }
    return dias;
  }

  async solicitarTurno() {
    if (this.turnoForm.valid) {
      const { especialidad, especialista, dia, hora, paciente } = this.turnoForm.value;
      const match = /^(\d{4}-\d{2}-\d{2}) \(([^)]+)\)$/.exec(dia);
      const FechaTurno = match ? match[1] : dia;
      const HorarioTurno = hora;
      let pacienteId = null;
      let pacienteNombre = '';
      let pacienteApellido = '';
      if (this.esAdmin) {
        pacienteId = paciente;
        const pacienteObj = this.pacientes.find(p => p.id === paciente);
        pacienteNombre = pacienteObj ? pacienteObj.nombre : '';
        pacienteApellido = pacienteObj ? pacienteObj.apellido : '';
      } else {
        pacienteId = getAuth().currentUser?.uid || null;
        if (pacienteId) {
          const pacienteDocRef = doc(this.firestore, 'pacientes', pacienteId);
          const pacienteSnap = await getDoc(pacienteDocRef);
          if (pacienteSnap.exists()) {
            const data = pacienteSnap.data();
            pacienteNombre = data['nombre'] || '';
            pacienteApellido = data['apellido'] || '';
          }
        }
      }
      const especialistaObj = this.especialistas.find(e => e.id === especialista);
      const especialistaNombre = especialistaObj ? especialistaObj.nombre : '';
      const especialistaApellido = especialistaObj ? especialistaObj.apellido : '';
      const turno = {
        especialidad,
        especialistaId: especialista,
        especialistaNombre,
        especialistaApellido,
        pacienteId,
        pacienteNombre,
        pacienteApellido,
        FechaTurno,
        HorarioTurno,
        estado: 'pendiente',
        fechaSolicitud: new Date()
      };
      await addDoc(collection(this.firestore, 'Turnos'), turno);
      this.mensajeExito = '¡Turno solicitado con éxito!';
      setTimeout(() => { this.mensajeExito = ''; }, 3000);
      this.turnoForm.reset();
      this.especialistasFiltrados = [];
    }
  }
}
