import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, getDocs, setDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.css'
})
export class UsuariosComponent implements OnInit {
  usuarios: any[] = [];
  usuarioActual: any = null;

  // Para mostrar/ocultar el form de admin
  mostrarFormularioAdmin: boolean = false;

  // Campos del form de admin
  adminNombre: string = '';
  adminApellido: string = '';
  adminEdad: string = '';
  adminDni: string = '';
  adminMail: string = '';
  adminPassword: string = '';
  adminImagen: File | null = null;

  adminOriginalMail: string = '';
  adminOriginalPassword: string = '';

  adminError: string = '';
  adminSuccess: string = '';

  historiaClinicaTurnos: any[] = [];
  mostrarModalHistoriaClinica: boolean = false;
  pacienteHistoriaSeleccionado: any = null;

  constructor(private router: Router) {}

  async ngOnInit() {
    const auth = getAuth();
    const db = getFirestore();

    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        this.router.navigate(['/login']);
        return;
      }

      let intentos = 0;
      let adminDocSnap = null;
      while (intentos < 10) {
        adminDocSnap = await getDoc(doc(db, 'administradores', user.uid));
        if (adminDocSnap.exists()) break;
        await new Promise(res => setTimeout(res, 200));
        intentos++;
      }

      if (!adminDocSnap || !adminDocSnap.exists()) {
        this.usuarioActual = null;
        return;
      }

      this.usuarioActual = { tipo: 'administrador', uid: user.uid };
      await this.cargarUsuarios();
    });
  }

  async cargarUsuarios() {
    const db = getFirestore();
    this.usuarios = [];
    // Traer pacientes
    const pacientesSnap = await getDocs(collection(db, 'pacientes'));
    pacientesSnap.forEach(docSnap => {
      this.usuarios.push({ ...docSnap.data(), tipo: 'paciente', uid: docSnap.id });
    });
    // Traer especialistas
    const especialistasSnap = await getDocs(collection(db, 'especialistas'));
    especialistasSnap.forEach(docSnap => {
      this.usuarios.push({ ...docSnap.data(), tipo: 'especialista', uid: docSnap.id });
    });
    // Traer administradores
    const adminsSnap = await getDocs(collection(db, 'administradores'));
    adminsSnap.forEach(docSnap => {
      this.usuarios.push({ ...docSnap.data(), tipo: 'administrador', uid: docSnap.id });
    });
  }

  tieneEspecialistas(): boolean {
    return this.usuarios.some(u => u.tipo === 'especialista');
  }

  async cambiarEstadoEspecialista(usuario: any) {
    const db = getFirestore();
    const especialistaRef = doc(db, 'especialistas', usuario.uid);
    await updateDoc(especialistaRef, { aprobado: !usuario.aprobado });
    await this.cargarUsuarios();
  }

  async registrarAdmin() {
    this.adminError = '';
    this.adminSuccess = '';
    if (!this.adminNombre || !this.adminApellido || !this.adminEdad || !this.adminDni || !this.adminMail || !this.adminPassword || !this.adminImagen) {
      this.adminError = 'Todos los campos son obligatorios.';
      return;
    }

    const auth = getAuth();
    const db = getFirestore();
    const storage = getStorage();

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, this.adminMail, this.adminPassword);
      const user = userCredential.user;
      await sendEmailVerification(user);

      const storageRef = ref(storage, `imagenes/Administradores/${user.uid}_${Date.now()}.jpg`);
      await uploadBytes(storageRef, this.adminImagen);
      const imageUrl = await getDownloadURL(storageRef);

      const userData = {
        nombre: this.adminNombre,
        apellido: this.adminApellido,
        edad: Number(this.adminEdad),
        dni: this.adminDni,
        correo: this.adminMail,
        imagenPerfil: [imageUrl]
      };
      const userDoc = doc(db, 'administradores', user.uid);
      await setDoc(userDoc, userData);

      this.adminSuccess = 'Administrador registrado correctamente.';
      this.adminNombre = '';
      this.adminApellido = '';
      this.adminEdad = '';
      this.adminDni = '';
      this.adminMail = '';
      this.adminPassword = '';
      this.adminImagen = null;
      await this.cargarUsuarios();

    } catch (err: any) {
      this.adminError = err.message || 'Error al crear administrador';
    }
  }

  onAdminImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.adminImagen = input.files[0];
    }
  }

  async verHistoriaClinica(paciente: any) {
    this.pacienteHistoriaSeleccionado = paciente;
    this.historiaClinicaTurnos = [];
    this.mostrarModalHistoriaClinica = true;
    const db = getFirestore();
    const turnosSnap = await getDocs(collection(db, 'Turnos'));
    this.historiaClinicaTurnos = turnosSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter((turno: any) => turno.pacienteId === paciente.uid && turno.estado === 'realizado');
  }

  cerrarModalHistoriaClinica() {
    this.mostrarModalHistoriaClinica = false;
    this.pacienteHistoriaSeleccionado = null;
    this.historiaClinicaTurnos = [];
  }

  tieneHistoriaClinica(u: any): boolean {
    return u.tipo === 'paciente' && !!u.historiaClinica;
  }

  exportarUsuariosExcel() {
    const data = this.usuarios.map(u => ({
      Tipo: u.tipo,
      Nombre: u.nombre,
      Apellido: u.apellido,
      Correo: u.correo,
      DNI: u.dni,
      Edad: u.edad,
      Estado: u.aprobado !== undefined ? (u.aprobado ? 'Habilitado' : 'Inhabilitado') : ''
    }));
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');
    const excelBuffer: any = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([excelBuffer], { type: 'application/octet-stream' }), 'usuarios.xlsx');
  }

  async exportarTurnosPacienteExcel(paciente: any) {
    const db = getFirestore();
    const turnosSnap = await getDocs(collection(db, 'Turnos'));
    const turnos = turnosSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter((turno: any) => turno.pacienteId === paciente.uid);
    const data = turnos.map((t: any) => ({
      Fecha: t.FechaTurno,
      Horario: t.HorarioTurno,
      Especialista: (t.especialistaNombre || '') + ' ' + (t.especialistaApellido || ''),
      Especialidad: t.especialidad,
      Estado: t.estado,
      Altura: t.historiaClinica?.altura || '',
      Peso: t.historiaClinica?.peso || '',
      Temperatura: t.historiaClinica?.temperatura || '',
      Presion: t.historiaClinica?.presion || '',
      DatosDinamicos: t.historiaClinica?.datosDinamicos?.map((d: any) => `${d.clave}: ${d.valor}`).join('; ') || ''
    }));
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'TurnosPaciente');
    const excelBuffer: any = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([excelBuffer], { type: 'application/octet-stream' }), `turnos_${paciente.nombre}_${paciente.apellido}.xlsx`);
  }
}
