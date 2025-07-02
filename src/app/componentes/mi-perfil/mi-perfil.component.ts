import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Firestore, doc, getDoc, updateDoc, collection, addDoc, deleteDoc, query, where, getDocs } from '@angular/fire/firestore';
import { Auth, user, User } from '@angular/fire/auth';
import { Observable, firstValueFrom } from 'rxjs';

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
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
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

  // Variables para el modal de confirmación
  mostrarModalEliminar = false;
  horarioAEliminar: { id: string, dia: string, hora: string } | null = null;

  // NUEVO: Modal de éxito al guardar horario
  mostrarModalExito = false;
  // NUEVO: Modal de error al intentar agregar horarios repetidos
  mostrarModalError = false;
  mensajeError = '';

  especialidadSeleccionada: string = '';

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
}
