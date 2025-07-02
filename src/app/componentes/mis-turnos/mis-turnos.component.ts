import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, collectionData, query, where, updateDoc, doc, getDoc } from '@angular/fire/firestore';
import { getAuth } from 'firebase/auth';

@Component({
  selector: 'app-mis-turnos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mis-turnos.component.html',
  styleUrl: './mis-turnos.component.css'
})
export class MisTurnosComponent implements OnInit {
  turnos: any[] = [];
  turnosFiltrados: any[] = [];
  filtro: string = '';
  uid: string = '';
  firestore: Firestore = inject(Firestore);

  esPaciente: boolean = false;
  esEspecialista: boolean = false;
  esAdmin: boolean = false;

  mostrarModalCancelar: boolean = false;
  mostrarModalRechazar: boolean = false;
  mostrarModalFinalizar: boolean = false;
  turnoAOperar: any = null;
  motivoOperacion: string = '';
  errorMotivo: string = '';
  resenaFinal: string = '';

  mostrarModalResena: boolean = false;
  resenaAMostrar: string = '';

  mostrarModalMotivo: boolean = false;
  motivoAMostrar: string = '';

  async ngOnInit() {
    const user = getAuth().currentUser;
    if (user) {
      this.uid = user.uid;
      const adminDocRef = doc(this.firestore, 'administradores', this.uid);
      const adminDocSnap = await getDoc(adminDocRef);
      const especialistaDocRef = doc(this.firestore, 'especialistas', this.uid);
      const especialistaDocSnap = await getDoc(especialistaDocRef);
      this.esAdmin = adminDocSnap.exists();
      this.esEspecialista = especialistaDocSnap.exists();
      this.esPaciente = !this.esEspecialista && !this.esAdmin;
      await this.cargarTurnos();
    }
  }

  async cargarTurnos() {
    const turnosRef = collection(this.firestore, 'Turnos');
    let q;
    if (this.esPaciente) {
      q = query(turnosRef, where('pacienteId', '==', this.uid));
    } else if (this.esEspecialista) {
      q = query(turnosRef, where('especialistaId', '==', this.uid));
    } else if (this.esAdmin) {
      q = turnosRef; // Todos los turnos
    }
    if (q) {
      collectionData(q, { idField: 'id' }).subscribe((turnos: any[]) => {
        this.turnos = turnos;
        this.aplicarFiltro();
      });
    }
  }

  aplicarFiltro() {
    const filtro = this.filtro.trim().toLowerCase();
    if (!filtro) {
      this.turnosFiltrados = this.turnos;
      return;
    }
    if (this.esPaciente) {
      this.turnosFiltrados = this.turnos.filter(turno =>
        (turno.especialidad && turno.especialidad.toLowerCase().includes(filtro)) ||
        (turno.especialistaNombre && turno.especialistaNombre.toLowerCase().includes(filtro)) ||
        (turno.especialistaApellido && turno.especialistaApellido.toLowerCase().includes(filtro))
      );
    } else if (this.esEspecialista) {
      this.turnosFiltrados = this.turnos.filter(turno =>
        (turno.especialidad && turno.especialidad.toLowerCase().includes(filtro)) ||
        (turno.pacienteNombre && turno.pacienteNombre.toLowerCase().includes(filtro)) ||
        (turno.pacienteApellido && turno.pacienteApellido.toLowerCase().includes(filtro))
      );
    } else if (this.esAdmin) {
      this.turnosFiltrados = this.turnos.filter(turno =>
        (turno.especialidad && turno.especialidad.toLowerCase().includes(filtro)) ||
        (turno.especialistaNombre && turno.especialistaNombre.toLowerCase().includes(filtro)) ||
        (turno.especialistaApellido && turno.especialistaApellido.toLowerCase().includes(filtro))
      );
    }
  }

  // --- ACCIONES PARA PACIENTE ---
  abrirModalCancelar(turno: any) {
    this.turnoAOperar = turno;
    this.motivoOperacion = '';
    this.errorMotivo = '';
    this.mostrarModalCancelar = true;
  }
  cerrarModalCancelar() {
    this.mostrarModalCancelar = false;
    this.turnoAOperar = null;
    this.motivoOperacion = '';
    this.errorMotivo = '';
  }
  async confirmarCancelacion() {
    if (!this.motivoOperacion.trim()) {
      this.errorMotivo = 'Debes ingresar un motivo para cancelar el turno.';
      return;
    }
    const turnoRef = doc(this.firestore, 'Turnos', this.turnoAOperar.id);
    await updateDoc(turnoRef, {
      estado: 'cancelado',
      comentarioCancelacion: this.motivoOperacion.trim()
    });
    this.cerrarModalCancelar();
    await this.cargarTurnos();
  }

  // --- ACCIONES PARA ESPECIALISTA ---
  abrirModalRechazar(turno: any) {
    this.turnoAOperar = turno;
    this.motivoOperacion = '';
    this.errorMotivo = '';
    this.mostrarModalRechazar = true;
  }
  cerrarModalRechazar() {
    this.mostrarModalRechazar = false;
    this.turnoAOperar = null;
    this.motivoOperacion = '';
    this.errorMotivo = '';
  }
  async confirmarRechazo() {
    if (!this.motivoOperacion.trim()) {
      this.errorMotivo = 'Debes ingresar un motivo para rechazar el turno.';
      return;
    }
    const turnoRef = doc(this.firestore, 'Turnos', this.turnoAOperar.id);
    await updateDoc(turnoRef, {
      estado: 'rechazado',
      comentarioRechazo: this.motivoOperacion.trim()
    });
    this.cerrarModalRechazar();
    await this.cargarTurnos();
  }

  async aceptarTurno(turno: any) {
    const turnoRef = doc(this.firestore, 'Turnos', turno.id);
    await updateDoc(turnoRef, { estado: 'aceptado' });
    await this.cargarTurnos();
  }

  abrirModalFinalizar(turno: any) {
    this.turnoAOperar = turno;
    this.resenaFinal = '';
    this.errorMotivo = '';
    this.mostrarModalFinalizar = true;
  }
  cerrarModalFinalizar() {
    this.mostrarModalFinalizar = false;
    this.turnoAOperar = null;
    this.resenaFinal = '';
    this.errorMotivo = '';
  }
  async confirmarFinalizacion() {
    if (!this.resenaFinal.trim()) {
      this.errorMotivo = 'Debes ingresar una reseña o comentario.';
      return;
    }
    const turnoRef = doc(this.firestore, 'Turnos', this.turnoAOperar.id);
    await updateDoc(turnoRef, {
      estado: 'realizado',
      resena: this.resenaFinal.trim()
    });
    this.cerrarModalFinalizar();
    await this.cargarTurnos();
  }

  abrirModalResena(turno: any) {
    this.resenaAMostrar = turno.resena || 'Sin reseña disponible.';
    this.mostrarModalResena = true;
  }
  cerrarModalResena() {
    this.mostrarModalResena = false;
    this.resenaAMostrar = '';
  }

  async limpiarRechazados() {
    const rechazados = this.turnosFiltrados.filter(t => t.estado === 'rechazado');
    for (const turno of rechazados) {
      const turnoRef = doc(this.firestore, 'Turnos', turno.id);
      await updateDoc(turnoRef, { eliminado: true });
    }
    await this.cargarTurnos();
  }

  tieneRechazados(): boolean {
    return this.turnosFiltrados.some(t => t.estado === 'rechazado');
  }

  abrirModalMotivo(turno: any) {
    this.turnoAOperar = turno;
    if (turno.estado === 'cancelado') {
      this.motivoAMostrar = turno.comentarioCancelacion || 'Sin motivo registrado.';
    } else if (turno.estado === 'rechazado') {
      this.motivoAMostrar = turno.comentarioRechazo || 'Sin motivo registrado.';
    }
    this.mostrarModalMotivo = true;
  }
  cerrarModalMotivo() {
    this.mostrarModalMotivo = false;
    this.motivoAMostrar = '';
    this.turnoAOperar = null;
  }

  // Acción cancelar turno para admin
  puedeCancelarAdmin(turno: any): boolean {
    return this.esAdmin && !['aceptado', 'realizado', 'rechazado'].includes(turno.estado);
  }
} 