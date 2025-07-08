import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Firestore, doc, getDoc, updateDoc, collection, addDoc, deleteDoc, query, where, getDocs } from '@angular/fire/firestore';
import { Auth, user, User } from '@angular/fire/auth';
import { Observable, firstValueFrom } from 'rxjs';
import { collectionData } from '@angular/fire/firestore';
import jsPDF from 'jspdf';
import { FormatoFechaPipe } from '../../pipes/formato-fecha.pipe';

interface Especialista {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  imagenUrl?: string;
  especialidad: string;
  horarios?: HorarioDisponibilidad[];
  imagenPerfil?: string[];
}

interface HorarioDisponibilidad {
  especialidad: string;
  dias: string[];
  horas: string[];
}

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, FormatoFechaPipe],
  templateUrl: './mi-perfil.component.html',
  styleUrl: './mi-perfil.component.css'
})
export class MiPerfilComponent implements OnInit {
  especialista: Especialista | null = null;
  perfilForm!: FormGroup;
  horariosForm!: FormGroup;
  diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  horas = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

  horariosCargados: any[] = [];

  mostrarModalEliminar = false;
  horarioAEliminar: { id: string, dia: string, hora: string } | null = null;

  mostrarModalExito = false;
  mostrarModalError = false;
  mensajeError = '';

  especialidadSeleccionada: string = '';

  historiaClinicaTurnos: any[] = [];
  mostrarModalHistoriaClinica: boolean = false;
  turnoHistoriaSeleccionado: any = null;

  esPaciente: boolean = false;
  datosPaciente: any = null;

  especialidadSeleccionadaPDF: string = '';
  especialidadesDisponibles: string[] = [];
  historiaClinicaFiltrada: any[] = [];

  private firestore: Firestore = inject(Firestore);
  private auth: Auth = inject(Auth);

  constructor(private fb: FormBuilder) {}

  async ngOnInit() {
    const usuario = await firstValueFrom(user(this.auth));
    if (!usuario) return;

    const docRef = doc(this.firestore, 'especialistas', usuario.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      this.especialista = { id: docSnap.id, ...docSnap.data() } as Especialista;
      if ((this.especialista as any).especialidades && (this.especialista as any).especialidades.length > 0) {
        this.especialidadSeleccionada = (this.especialista as any).especialidades[0];
      } else if (this.especialista.especialidad) {
        this.especialidadSeleccionada = this.especialista.especialidad;
      }
      this.perfilForm = new FormGroup({
        nombre: new FormControl(this.especialista?.nombre),
        apellido: new FormControl(this.especialista?.apellido),
        correo: new FormControl(this.especialista?.correo),
        especialidad: new FormControl(this.especialista?.especialidad)
      });
      this.horariosForm = this.fb.group({
        dias: this.fb.control(this.getDiasDisponibles()),
        horas: this.fb.control(this.getHorasDisponibles())
      });
      await this.cargarHorariosCargados();
      this.esPaciente = false;
    } else {
      this.esPaciente = true;
      const pacienteRef = doc(this.firestore, 'pacientes', usuario.uid);
      const pacienteSnap = await getDoc(pacienteRef);
      if (pacienteSnap.exists()) {
        const data = pacienteSnap.data();
        this.datosPaciente = {
          nombre: data['nombre'] || '',
          apellido: data['apellido'] || '',
          correo: data['correo'] || usuario.email,
          imagenPerfil: data['imagenPerfil'] || ''
        };
      } else {
        this.datosPaciente = { nombre: '', apellido: '', correo: usuario.email, imagenPerfil: '' };
      }
    }
    await this.cargarHistoriaClinica(usuario.uid);
  }

  getDiasDisponibles(): string[] {
    const horario = this.especialista?.horarios?.find((h: any) => h.especialidad === this.especialidadSeleccionada);
    return horario ? horario.dias : [];
  }

  getHorasDisponibles(): string[] {
    const horario = this.especialista?.horarios?.find((h: any) => h.especialidad === this.especialidadSeleccionada);
    return horario ? horario.horas : [];
  }

  async cargarHorariosCargados() {
    if (!this.especialista) return;
    const horariosRef = collection(this.firestore, 'Horarios');
    const q = query(
      horariosRef,
      where('especialistaId', '==', this.especialista.id),
      where('especialidad', '==', this.especialidadSeleccionada)
    );
    const snapshot = await getDocs(q);
    this.horariosCargados = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  confirmarEliminarHorario(id: string, dia: string, hora: string) {
    this.horarioAEliminar = { id, dia, hora };
    this.mostrarModalEliminar = true;
  }

  cancelarEliminarHorario() {
    this.mostrarModalEliminar = false;
    this.horarioAEliminar = null;
  }

  async eliminarHorarioConfirmado() {
    if (!this.horarioAEliminar) return;
    const horarioDocRef = doc(this.firestore, 'Horarios', this.horarioAEliminar.id);
    await deleteDoc(horarioDocRef);
    await this.cargarHorariosCargados();
    this.cancelarEliminarHorario();
  }

  async guardarHorarios() {
    if (!this.especialista) return;

    const horariosRef = collection(this.firestore, 'Horarios');
    const dias: string[] = this.horariosForm.value.dias || [];
    const horas: string[] = this.horariosForm.value.horas || [];
    let agregados = 0;
    for (const dia of dias) {
      for (const hora of horas) {
        const q = query(
          horariosRef,
          where('especialistaId', '==', this.especialista.id),
          where('dia', '==', dia),
          where('hora', '==', hora)
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          await addDoc(horariosRef, {
            especialistaId: this.especialista.id,
            nombre: this.especialista.nombre,
            apellido: this.especialista.apellido,
            especialidad: this.especialidadSeleccionada,
            dia,
            hora
          });
          agregados++;
        }
      }
    }
    await this.cargarHorariosCargados();
    if (agregados > 0) {
      this.mostrarModalExito = true;
      setTimeout(() => { this.mostrarModalExito = false; }, 2000);
    } else {
      this.mensajeError = 'Todos los horarios seleccionados ya existen.';
      this.mostrarModalError = true;
      setTimeout(() => { this.mostrarModalError = false; }, 2500);
    }
  }

  get getEspecialidades(): string[] {
    if ((this.especialista as any)?.especialidades && Array.isArray((this.especialista as any).especialidades)) {
      return (this.especialista as any).especialidades;
    } else if (this.especialista?.especialidad) {
      return [this.especialista.especialidad];
    }
    return [];
  }

  async onEspecialidadSeleccionadaChange() {
    this.horariosForm.patchValue({
      dias: this.getDiasDisponibles(),
      horas: this.getHorasDisponibles()
    });
    await this.cargarHorariosCargados();
  }

  async cargarHistoriaClinica(uid: string) {
    const turnosRef = collection(this.firestore, 'Turnos');
    const q = query(turnosRef, where('pacienteId', '==', uid), where('estado', '==', 'realizado'));
    const snapshot = await getDocs(q);
    this.historiaClinicaTurnos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const especialidadesSet = new Set<string>();
    this.historiaClinicaTurnos.forEach(turno => {
      if (turno.especialidad) {
        especialidadesSet.add(turno.especialidad);
      }
    });
    this.especialidadesDisponibles = Array.from(especialidadesSet).sort();
    
    this.historiaClinicaFiltrada = [...this.historiaClinicaTurnos];
  }

  abrirModalHistoriaClinica(turno: any) {
    this.turnoHistoriaSeleccionado = turno;
    this.mostrarModalHistoriaClinica = true;
  }

  cerrarModalHistoriaClinica() {
    this.turnoHistoriaSeleccionado = null;
    this.mostrarModalHistoriaClinica = false;
  }

  onEspecialidadPDFChange() {
    if (this.especialidadSeleccionadaPDF === '') {
      this.historiaClinicaFiltrada = [...this.historiaClinicaTurnos];
    } else {
      this.historiaClinicaFiltrada = this.historiaClinicaTurnos.filter(
        turno => turno.especialidad === this.especialidadSeleccionadaPDF
      );
    }
  }

  descargarHistoriaClinicaPDF() {
    if (this.historiaClinicaFiltrada.length === 0) {
      alert('No hay turnos para descargar con los filtros seleccionados.');
      return;
    }

    const fechaActual = new Date().toLocaleDateString('es-ES');
    
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      
      const base64Image = canvas.toDataURL('image/png');
      this.generarPDFConLogo(base64Image, fechaActual);
    };
    
    img.onerror = () => {
      console.error('Error cargando el logo desde assets');
      this.generarPDFSinLogo(new jsPDF(), fechaActual);
    };
    
    img.src = 'assets/Bartel Clinica.png';
  }

  private generarPDFConLogo(base64Image: string, fechaActual: string) {
    const pdf = new jsPDF();
    const colorAzul = [25, 118, 210];
    const colorGris = [128, 128, 128];
    
    pdf.addImage(base64Image, 'PNG', 20, 15, 40, 40);
    
    pdf.setFontSize(20);
    pdf.setTextColor(colorAzul[0], colorAzul[1], colorAzul[2]);
    pdf.text('HISTORIA CLÍNICA', 105, 35, { align: 'center' });
    
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Paciente: ${this.datosPaciente.nombre} ${this.datosPaciente.apellido}`, 20, 75);
    pdf.text(`Fecha de emisión: ${fechaActual}`, 20, 85);
    
    if (this.especialidadSeleccionadaPDF) {
      pdf.text(`Especialidad: ${this.especialidadSeleccionadaPDF}`, 20, 95);
    }
    
    pdf.setDrawColor(colorAzul[0], colorAzul[1], colorAzul[2]);
    pdf.line(20, 105, 190, 105);
    
    let yPosition = 120;
    let pageNumber = 1;
    
    this.historiaClinicaFiltrada.forEach((turno, index) => {
      if (yPosition > 250) {
        pdf.addPage();
        pageNumber++;
        yPosition = 20;
      }
      
      pdf.setFontSize(14);
      pdf.setTextColor(colorAzul[0], colorAzul[1], colorAzul[2]);
      pdf.text(`Turno ${index + 1}`, 20, yPosition);
      
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      yPosition += 10;
      pdf.text(`Fecha: ${turno.FechaTurno}`, 20, yPosition);
      yPosition += 7;
      pdf.text(`Hora: ${turno.HorarioTurno}`, 20, yPosition);
      yPosition += 7;
      pdf.text(`Especialista: ${turno.especialistaNombre} ${turno.especialistaApellido}`, 20, yPosition);
      yPosition += 7;
      pdf.text(`Especialidad: ${turno.especialidad}`, 20, yPosition);
      
      if (turno.historiaClinica) {
        yPosition += 10;
        pdf.setFontSize(12);
        pdf.setTextColor(colorAzul[0], colorAzul[1], colorAzul[2]);
        pdf.text('Datos de la consulta:', 20, yPosition);
        
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        yPosition += 7;
        pdf.text(`Altura: ${turno.historiaClinica.altura || '-'} cm`, 20, yPosition);
        yPosition += 7;
        pdf.text(`Peso: ${turno.historiaClinica.peso || '-'} kg`, 20, yPosition);
        yPosition += 7;
        pdf.text(`Temperatura: ${turno.historiaClinica.temperatura || '-'} °C`, 20, yPosition);
        yPosition += 7;
        pdf.text(`Presión: ${turno.historiaClinica.presion || '-'}`, 20, yPosition);
        
        if (turno.historiaClinica.datosDinamicos && turno.historiaClinica.datosDinamicos.length > 0) {
          yPosition += 10;
          pdf.setFontSize(12);
          pdf.setTextColor(colorAzul[0], colorAzul[1], colorAzul[2]);
          pdf.text('Datos adicionales:', 20, yPosition);
          
          pdf.setFontSize(10);
          pdf.setTextColor(0, 0, 0);
          turno.historiaClinica.datosDinamicos.forEach((dato: any) => {
            yPosition += 7;
            pdf.text(`${dato.clave}: ${dato.valor}`, 25, yPosition);
          });
        }
      }
      
      yPosition += 10;
      pdf.setDrawColor(colorGris[0], colorGris[1], colorGris[2]);
      pdf.line(20, yPosition, 190, yPosition);
      yPosition += 15;
    });
    
    pdf.setFontSize(10);
    pdf.setTextColor(colorGris[0], colorGris[1], colorGris[2]);
    pdf.text(`Página ${pageNumber}`, 105, 280, { align: 'center' });
    
    const nombreArchivo = `historia_clinica_${this.datosPaciente.nombre}_${this.datosPaciente.apellido}_${fechaActual.replace(/\//g, '-')}.pdf`;
    
    pdf.save(nombreArchivo);
  }

  private generarPDFSinLogo(pdf: jsPDF, fechaActual: string) {
    const colorAzul = [25, 118, 210];
    const colorGris = [128, 128, 128];
    
    pdf.setFontSize(20);
    pdf.setTextColor(colorAzul[0], colorAzul[1], colorAzul[2]);
    pdf.text('HISTORIA CLÍNICA', 105, 85, { align: 'center' });
    
    pdf.setFontSize(16);
    pdf.setTextColor(colorGris[0], colorGris[1], colorGris[2]);
    pdf.text('🏥 CLÍNICA BARTEL', 105, 45, { align: 'center' });
    
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Paciente: ${this.datosPaciente.nombre} ${this.datosPaciente.apellido}`, 20, 65);
    pdf.text(`Fecha de emisión: ${fechaActual}`, 20, 75);
    
    if (this.especialidadSeleccionadaPDF) {
      pdf.text(`Especialidad: ${this.especialidadSeleccionadaPDF}`, 20, 85);
    }
    
    pdf.setDrawColor(colorAzul[0], colorAzul[1], colorAzul[2]);
    pdf.line(20, 95, 190, 95);
    
    let yPosition = 110;
    let pageNumber = 1;
    
    this.historiaClinicaFiltrada.forEach((turno, index) => {
      if (yPosition > 250) {
        pdf.addPage();
        pageNumber++;
        yPosition = 20;
      }
      
      pdf.setFontSize(14);
      pdf.setTextColor(colorAzul[0], colorAzul[1], colorAzul[2]);
      pdf.text(`Turno ${index + 1}`, 20, yPosition);
      
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      yPosition += 10;
      pdf.text(`Fecha: ${turno.FechaTurno}`, 20, yPosition);
      yPosition += 7;
      pdf.text(`Hora: ${turno.HorarioTurno}`, 20, yPosition);
      yPosition += 7;
      pdf.text(`Especialista: ${turno.especialistaNombre} ${turno.especialistaApellido}`, 20, yPosition);
      yPosition += 7;
      pdf.text(`Especialidad: ${turno.especialidad}`, 20, yPosition);
      
      if (turno.historiaClinica) {
        yPosition += 10;
        pdf.setFontSize(12);
        pdf.setTextColor(colorAzul[0], colorAzul[1], colorAzul[2]);
        pdf.text('Datos de la consulta:', 20, yPosition);
        
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        yPosition += 7;
        pdf.text(`Altura: ${turno.historiaClinica.altura || '-'} cm`, 20, yPosition);
        yPosition += 7;
        pdf.text(`Peso: ${turno.historiaClinica.peso || '-'} kg`, 20, yPosition);
        yPosition += 7;
        pdf.text(`Temperatura: ${turno.historiaClinica.temperatura || '-'} °C`, 20, yPosition);
        yPosition += 7;
        pdf.text(`Presión: ${turno.historiaClinica.presion || '-'}`, 20, yPosition);
        if (turno.historiaClinica.datosDinamicos && turno.historiaClinica.datosDinamicos.length > 0) {
          yPosition += 10;
          pdf.setFontSize(12);
          pdf.setTextColor(colorAzul[0], colorAzul[1], colorAzul[2]);
          pdf.text('Datos adicionales:', 20, yPosition);
          
          pdf.setFontSize(10);
          pdf.setTextColor(0, 0, 0);
          turno.historiaClinica.datosDinamicos.forEach((dato: any) => {
            yPosition += 7;
            pdf.text(`${dato.clave}: ${dato.valor}`, 25, yPosition);
          });
        }
      }
      
      yPosition += 10;
      pdf.setDrawColor(colorGris[0], colorGris[1], colorGris[2]);
      pdf.line(20, yPosition, 190, yPosition);
      yPosition += 15;
    });
    
    pdf.setFontSize(10);
    pdf.setTextColor(colorGris[0], colorGris[1], colorGris[2]);
    pdf.text(`Página ${pageNumber}`, 105, 280, { align: 'center' });
    
    const nombreArchivo = `historia_clinica_${this.datosPaciente.nombre}_${this.datosPaciente.apellido}_${fechaActual.replace(/\//g, '-')}.pdf`;
    
    pdf.save(nombreArchivo);
  }
}
