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

  // Variables para historia clínica
  altura: string = '';
  peso: string = '';
  temperatura: string = '';
  presion: string = '';
  datosDinamicos: { clave: string, valor: string }[] = [];
  claveDinamica: string = '';
  valorDinamico: string = '';
  errorHistoriaClinica: string = '';

  mensajeExito: string = '';

  mostrarModalEncuesta: boolean = false;
  comentarioEncuesta: string = '';
  estrellasEncuesta: number = 0;
  errorEncuesta: string = '';

  mostrarModalVerEncuesta: boolean = false;
  encuestaComentarioVer: string = '';
  encuestaEstrellasVer: number = 0;

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
    this.turnosFiltrados = this.turnos.filter(turno => {
      let texto = '';
      // Concatenar todos los campos principales del turno
      for (const key in turno) {
        if (typeof turno[key] === 'string' || typeof turno[key] === 'number') {
          texto += ' ' + turno[key];
        }
      }
      // Incluir historia clínica si existe
      if (turno.historiaClinica) {
        texto += ' ' + (turno.historiaClinica.altura || '');
        texto += ' ' + (turno.historiaClinica.peso || '');
        texto += ' ' + (turno.historiaClinica.temperatura || '');
        texto += ' ' + (turno.historiaClinica.presion || '');
        if (Array.isArray(turno.historiaClinica.datosDinamicos)) {
          turno.historiaClinica.datosDinamicos.forEach((dato: any) => {
            texto += ' ' + (dato.clave || '') + ' ' + (dato.valor || '');
          });
        }
      }
      return texto.toLowerCase().includes(filtro);
    });
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
    // Limpiar historia clínica
    this.altura = '';
    this.peso = '';
    this.temperatura = '';
    this.presion = '';
    this.datosDinamicos = [];
    this.claveDinamica = '';
    this.valorDinamico = '';
    this.errorHistoriaClinica = '';
  }
  cerrarModalFinalizar() {
    this.mostrarModalFinalizar = false;
    this.turnoAOperar = null;
    this.resenaFinal = '';
    this.errorMotivo = '';
  }
  async confirmarFinalizacion() {
    this.errorHistoriaClinica = '';
    this.errorMotivo = '';
    const alturaStr = this.altura !== undefined && this.altura !== null ? String(this.altura) : '';
    const pesoStr = this.peso !== undefined && this.peso !== null ? String(this.peso) : '';
    const temperaturaStr = this.temperatura !== undefined && this.temperatura !== null ? String(this.temperatura) : '';
    const presionStr = this.presion !== undefined && this.presion !== null ? String(this.presion) : '';
    if (!alturaStr.trim() || !pesoStr.trim() || !temperaturaStr.trim() || !presionStr.trim()) {
      this.errorHistoriaClinica = 'Debes completar todos los datos fijos de la historia clínica.';
      return;
    }
    if (!this.resenaFinal || !String(this.resenaFinal).trim()) {
      this.errorMotivo = 'Debes ingresar una reseña o comentario.';
      return;
    }
    const historiaClinica = {
      altura: alturaStr,
      peso: pesoStr,
      temperatura: temperaturaStr,
      presion: presionStr,
      datosDinamicos: this.datosDinamicos
    };
    const turnoRef = doc(this.firestore, 'Turnos', this.turnoAOperar.id);
    await updateDoc(turnoRef, {
      estado: 'realizado',
      resena: String(this.resenaFinal).trim(),
      historiaClinica: historiaClinica
    });
    this.cerrarModalFinalizar();
    this.mensajeExito = '¡Turno finalizado con éxito!';
    setTimeout(() => { this.mensajeExito = ''; }, 3500);
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

  // Métodos para datos dinámicos
  agregarDatoDinamico() {
    if (this.claveDinamica.trim() && this.valorDinamico.trim() && this.datosDinamicos.length < 3) {
      this.datosDinamicos.push({ clave: this.claveDinamica.trim(), valor: this.valorDinamico.trim() });
      this.claveDinamica = '';
      this.valorDinamico = '';
      this.errorHistoriaClinica = '';
    } else if (this.datosDinamicos.length >= 3) {
      this.errorHistoriaClinica = 'Solo puedes agregar hasta 3 datos dinámicos.';
    } else {
      this.errorHistoriaClinica = 'Debes completar clave y valor.';
    }
  }
  eliminarDatoDinamico(index: number) {
    this.datosDinamicos.splice(index, 1);
    this.errorHistoriaClinica = '';
  }

  abrirModalEncuesta(turno: any) {
    this.turnoAOperar = turno;
    this.comentarioEncuesta = '';
    this.estrellasEncuesta = 0;
    this.errorEncuesta = '';
    this.mostrarModalEncuesta = true;
  }
  cerrarModalEncuesta() {
    this.mostrarModalEncuesta = false;
    this.turnoAOperar = null;
    this.comentarioEncuesta = '';
    this.estrellasEncuesta = 0;
    this.errorEncuesta = '';
  }
  async confirmarEncuesta() {
    this.errorEncuesta = '';
    if (!this.comentarioEncuesta.trim() || this.estrellasEncuesta < 1) {
      this.errorEncuesta = 'Debes dejar un comentario y seleccionar una cantidad de estrellas.';
      return;
    }
    const turnoRef = doc(this.firestore, 'Turnos', this.turnoAOperar.id);
    await updateDoc(turnoRef, {
      encuestaComentario: this.comentarioEncuesta.trim(),
      encuestaEstrellas: this.estrellasEncuesta,
      encuestaCompletada: true
    });
    this.cerrarModalEncuesta();
    this.mensajeExito = '¡Encuesta enviada con éxito!';
    setTimeout(() => { this.mensajeExito = ''; }, 3500);
    await this.cargarTurnos();
  }

  abrirModalVerEncuesta(turno: any) {
    this.encuestaComentarioVer = turno.encuestaComentario || 'Sin comentario.';
    this.encuestaEstrellasVer = turno.encuestaEstrellas || 0;
    this.mostrarModalVerEncuesta = true;
  }
  cerrarModalVerEncuesta() {
    this.mostrarModalVerEncuesta = false;
    this.encuestaComentarioVer = '';
    this.encuestaEstrellasVer = 0;
  }
} 