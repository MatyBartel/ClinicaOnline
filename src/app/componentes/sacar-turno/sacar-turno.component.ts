import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Firestore, collection, collectionData, query, where, getDocs, addDoc, doc, getDoc } from '@angular/fire/firestore'; // <-- modular
import { map } from 'rxjs/operators';
import { getAuth } from 'firebase/auth';
import { firstValueFrom } from 'rxjs';

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

interface Profesional {
  id: string;
  nombre: string;
  imagen: string;
  especialidades: Especialidad[];
}

interface Especialidad {
  id: string;
  nombre: string;
  imagen: string;
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

  profesionales: Profesional[] = [];
  profesionalSeleccionado: Profesional | null = null;
  especialidadSeleccionada: Especialidad | null = null;
  diaSeleccionado: string | null = null;
  horariosDisponibles: string[] = [];
  horarioSeleccionado: string | null = null;

  enviando: boolean = false;

  horariosReservados: string[] = [];

  especialidadImagenes: { [nombre: string]: string } = {
    'Odontologo': 'https://firebasestorage.googleapis.com/v0/b/tpclinica-bartel.appspot.com/o/Especialidades%2Fodontologo.jpg?alt=media&token=532b9f54-92cb-4928-86d7-c971f567fe6f',
    'Pediatra': 'https://firebasestorage.googleapis.com/v0/b/tpclinica-bartel.appspot.com/o/Especialidades%2Fpediatra.jpg?alt=media&token=e93eb3a9-9988-45b1-b197-49219d195b61',
    'Kinesiologo': 'https://firebasestorage.googleapis.com/v0/b/tpclinica-bartel.appspot.com/o/Especialidades%2Fkinesiologi%CC%81a.png?alt=media&token=ec2ffb61-c4d0-443a-af9a-1db99176b2f9',
    'Cardiologo': 'https://firebasestorage.googleapis.com/v0/b/tpclinica-bartel.appspot.com/o/Especialidades%2Fcardiologo.png?alt=media&token=6196d14c-1acd-47c4-bdbf-9a170971b55b',
    'Clínico': 'https://firebasestorage.googleapis.com/v0/b/tpclinica-bartel.appspot.com/o/Especialidades%2Fclinico.jpg?alt=media&token=17https://firebasestorage.googleapis.com/v0/b/tpclinica-bartel.appspot.com/o/Especialidades%2Fclinico.jpg?alt=media&token=1703f9b0-ede3-4943-a0e4-2d644284ffdehttps://firebasestorage.googleapis.com/v0/b/tpclinica-bartel.appspot.com/o/Especialidades%2Fclinico.jpg?alt=media&token=1703f9b0-ede3-4943-a0e4-2d644284ffde03f9b0-ede3-4943-a0e4-2d644284ffde',
    'Dermatólogo': 'https://firebasestorage.googleapis.com/v0/b/tpclinica-bartel.appspot.com/o/Especialidades%2Fdermatologo.jpg?alt=media&token=89c12570-e117-4f79-86f4-3b5c1218ab14',
    'Traumatólogo': 'https://firebasestorage.googleapis.com/v0/b/tpclinica-bartel.appspot.com/o/Especialidades%2Ftraumatologo.jpeg?alt=media&token=3b4519c1-85c0-439c-9f7a-c5ec14145e0c',
    'default': 'https://firebasestorage.googleapis.com/v0/b/tpclinica-bartel.appspot.com/o/Especialidades%2Fdefault.jpg?alt=media&token=d5298d56-1986-405e-8fb5-8587562904e5'
  };

  private firestore: Firestore = inject(Firestore);

  constructor(private fb: FormBuilder) {}

  async ngOnInit() {
    this.turnoForm = this.fb.group({
      especialidad: ['', Validators.required],
      especialista: ['', Validators.required],
      dia: ['', Validators.required],
      hora: ['', Validators.required],
      paciente: ['']
    });

    await this.cargarProfesionalesDesdeFirestore();

    if (this.esAdmin) {
      const pacientesRef = collection(this.firestore, 'pacientes');
      collectionData(pacientesRef, { idField: 'id' }).subscribe((pacientes: any) => {
        this.pacientes = pacientes;
      });
    }
  }

  async cargarProfesionalesDesdeFirestore() {
    const especialistasRef = collection(this.firestore, 'especialistas');
    const qAprobados = query(especialistasRef, where('aprobado', '==', true));
    const snapshot = await getDocs(qAprobados);
    this.profesionales = snapshot.docs.map(doc => {
      const data = doc.data();
      let especialidades: Especialidad[] = [];
      if (Array.isArray(data['especialidades'])) {
        especialidades = data['especialidades'].map((esp: string, idx: number) => ({
          id: 'esp' + idx,
          nombre: esp,
          imagen: ''
        }));
      } else if (data['especialidad']) {
        especialidades = [{ id: 'esp1', nombre: data['especialidad'], imagen: '' }];
      }
      return {
        id: doc.id,
        nombre: data['nombre'] + ' ' + data['apellido'],
        imagen: Array.isArray(data['imagenPerfil']) && data['imagenPerfil'].length > 0 ? data['imagenPerfil'][0] : 'https://cdn-icons-png.flaticon.com/512/3774/3774296.png',
        especialidades
      };
    });
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
    if (this.enviando) return;
    if (!this.horarioSeleccionado) {
      this.mensajeExito = 'Debes seleccionar un horario válido.';
      setTimeout(() => { this.mensajeExito = ''; }, 3000);
      return;
    }
    this.enviando = true;
    const currentUser = getAuth().currentUser;
    if (!currentUser) {
      this.mensajeExito = 'Debes estar logueado para solicitar un turno.';
      setTimeout(() => { this.mensajeExito = ''; }, 3000);
      this.enviando = false;
      return;
    }

    // Validar que el horario sigue disponible
    const turnosRef = collection(this.firestore, 'Turnos');
    const q = query(
      turnosRef,
      where('especialistaId', '==', this.profesionalSeleccionado?.id),
      where('especialidad', '==', this.especialidadSeleccionada?.nombre),
      where('FechaTurno', '==', this.diaSeleccionado),
      where('HorarioTurno', '==', this.horarioSeleccionado)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      this.mensajeExito = 'Ese horario ya fue reservado. Por favor, elige otro.';
      setTimeout(() => { this.mensajeExito = ''; }, 3000);
      this.enviando = false;
      return;
    }

    // Obtener datos del paciente (nombre y apellido)
    let pacienteNombre = '';
    let pacienteApellido = '';
    try {
      const pacienteDoc = await getDoc(doc(this.firestore, 'pacientes', currentUser.uid));
      if (pacienteDoc.exists()) {
        const data = pacienteDoc.data();
        pacienteNombre = data['nombre'] || '';
        pacienteApellido = data['apellido'] || '';
      }
    } catch {}

    // Obtener datos del especialista (nombre y apellido)
    let especialistaNombre = '';
    let especialistaApellido = '';
    if (this.profesionalSeleccionado) {
      const partes = this.profesionalSeleccionado.nombre.split(' ');
      especialistaNombre = partes[0] || '';
      especialistaApellido = partes.slice(1).join(' ') || '';
    }

    const turno = {
      especialistaId: this.profesionalSeleccionado?.id,
      especialistaNombre,
      especialistaApellido,
      especialidad: this.especialidadSeleccionada?.nombre,
      FechaTurno: this.diaSeleccionado,
      HorarioTurno: this.horarioSeleccionado,
      pacienteId: currentUser.uid,
      pacienteNombre,
      pacienteApellido,
      estado: 'pendiente',
      fechaSolicitud: new Date()
    };

    try {
      await addDoc(collection(this.firestore, 'Turnos'), turno);
      this.mensajeExito = '¡Turno solicitado con éxito!';
    } catch (error) {
      this.mensajeExito = 'Error al solicitar el turno: ' + (error as any).message;
    }
    setTimeout(() => { this.mensajeExito = ''; }, 3000);
    this.profesionalSeleccionado = null;
    this.especialidadSeleccionada = null;
    this.diaSeleccionado = null;
    this.horarioSeleccionado = null;
    this.enviando = false;
  }

  seleccionarProfesional(prof: Profesional) {
    this.profesionalSeleccionado = prof;
    this.especialidadSeleccionada = null;
    this.diaSeleccionado = null;
    this.horarioSeleccionado = null;
    // Simula días disponibles
    this.diasDisponibles = ['09-09-2021', '10-09-2021', '11-09-2021'];
  }

  seleccionarEspecialidad(esp: Especialidad) {
    this.especialidadSeleccionada = esp;
    this.diaSeleccionado = null;
    this.horarioSeleccionado = null;
    // Simula días disponibles
    this.diasDisponibles = ['09-09-2021', '10-09-2021', '11-09-2021'];
  }

  async seleccionarDia(dia: string) {
    this.diaSeleccionado = dia;
    this.horarioSeleccionado = null;
    // Simula horarios disponibles
    this.horariosDisponibles = ['08:00am', '09:30am', '11:00am', '12:15pm'];

    // Cargar horarios reservados reales
    if (this.profesionalSeleccionado && this.especialidadSeleccionada) {
      const turnosRef = collection(this.firestore, 'Turnos');
      const q = query(
        turnosRef,
        where('especialistaId', '==', this.profesionalSeleccionado.id),
        where('especialidad', '==', this.especialidadSeleccionada.nombre),
        where('FechaTurno', '==', dia)
      );
      const snapshot = await getDocs(q);
      this.horariosReservados = snapshot.docs.map(doc => doc.data()['HorarioTurno']);
    } else {
      this.horariosReservados = [];
    }
  }

  esHorarioDisponible(hora: string): boolean {
    return !this.horariosReservados.includes(hora);
  }

  async seleccionarHorario(horario: string) {
    // Verifica si ya existe un turno reservado para este profesional, especialidad, día y horario
    const turnosRef = collection(this.firestore, 'Turnos');
    const q = query(
      turnosRef,
      where('especialistaId', '==', this.profesionalSeleccionado?.id),
      where('especialidad', '==', this.especialidadSeleccionada?.nombre),
      where('FechaTurno', '==', this.diaSeleccionado),
      where('HorarioTurno', '==', horario)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      // No mostrar mensaje de error aquí, solo no permitir seleccionar
      return;
    }
    this.horarioSeleccionado = horario;
    this.mensajeExito = '';
  }

  confirmarTurno() {
    // Aquí iría la lógica para guardar el turno
    alert(`Turno reservado con ${this.profesionalSeleccionado?.nombre} - ${this.especialidadSeleccionada?.nombre} el ${this.diaSeleccionado} a las ${this.horarioSeleccionado}`);
    // Reinicia el flujo
    this.profesionalSeleccionado = null;
    this.especialidadSeleccionada = null;
    this.diaSeleccionado = null;
    this.horarioSeleccionado = null;
  }

  getImagenEspecialidad(nombre: string): string {
    return this.especialidadImagenes[nombre] || this.especialidadImagenes['default'];
  }
}
