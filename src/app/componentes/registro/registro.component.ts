import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { getAuth, createUserWithEmailAndPassword, fetchSignInMethodsForEmail, sendEmailVerification } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { Router } from '@angular/router';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.css']
})
export class RegistroComponent {
  @Output() loginStatusChange = new EventEmitter<boolean>();

  correo: string = '';
  contrasena: string = '';
  tipoSeleccionado: string | null = null;
  nombre: string = '';
  apellido: string = '';
  dni: string = '';
  edad: string = '';
  obraSocial: string = '';
  nuevaEspecialidad: string = '';
  errorMessage: string = '';

  mostrarFormularioRegistro: boolean = false;

  imagenesPerfil: any = {
    paciente: {
      fotoPerfil: null as File | null,
      fotoPerfil2: null as File | null
    },
    especialista: {
      fotoPerfil: null as File | null
    }
  };

  imagenesPerfilPreview: any = {
    paciente: {
      fotoPerfil: null as string | null,
      fotoPerfil2: null as string | null
    },
    especialista: {
      fotoPerfil: null as string | null
    }
  };

  especialidades: string[] = [];

  constructor(private router: Router) { }

  seleccionarTipo(tipo: string) {
    this.tipoSeleccionado = tipo;
  }

  agregarEspecialidad() {
    if (this.nuevaEspecialidad.trim() !== '' && !this.especialidades.includes(this.nuevaEspecialidad.trim())) {
      this.especialidades.push(this.nuevaEspecialidad.trim());
      this.nuevaEspecialidad = '';
    }
  }

  eliminarEspecialidad(index: number) {
    this.especialidades.splice(index, 1);
  }

  onImageSelected(event: Event, tipo: 'paciente' | 'especialista', campo: string) {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    if (tipo === 'paciente') {
      this.imagenesPerfil.paciente[campo] = file;
    } else if (tipo === 'especialista') {
      this.imagenesPerfil.especialista[campo] = file;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (tipo === 'paciente') {
        this.imagenesPerfilPreview.paciente[campo] = reader.result as string;
      } else if (tipo === 'especialista') {
        this.imagenesPerfilPreview.especialista[campo] = reader.result as string;
      }
    };
    reader.readAsDataURL(file);
  }

  private async verificarCorreoExistente(correo: string): Promise<boolean> {
    try {
      const auth = getAuth();
      const metodos = await fetchSignInMethodsForEmail(auth, correo);
      return metodos.length > 0;
    } catch (error) {
      console.error('Error al verificar correo existente:', error);
      throw new Error('Error al verificar correo existente.');
    }
  }

  async onSubmit() {
    const auth = getAuth();
    const db = getFirestore();
    const storage = getStorage();

    if (!this.nombre || !this.apellido || !this.dni || !this.edad) {
      this.errorMessage = 'Todos los campos son obligatorios.';
      return;
    }

    if (!this.correo || !this.contrasena) {
      this.errorMessage = 'Correo y contraseña son obligatorios.';
      return;
    }

    const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.correo);
    if (!correoValido) {
      this.errorMessage = 'El formato del correo es inválido.';
      return;
    }

    try {
      if (await this.verificarCorreoExistente(this.correo)) {
        this.errorMessage = 'El correo ya está registrado. Por favor, utiliza otro.';
        return;
      }
    } catch (error) {
      this.errorMessage = 'Error al verificar el correo. Intenta nuevamente.';
      return;
    }

    if (this.tipoSeleccionado === 'paciente') {
      if (!this.imagenesPerfil.paciente.fotoPerfil || !this.imagenesPerfil.paciente.fotoPerfil2) {
        this.errorMessage = 'Por favor, carga ambas imágenes del perfil del paciente.';
        return;
      }
    } else if (this.tipoSeleccionado === 'especialista') {
      if (!this.imagenesPerfil.especialista.fotoPerfil) {
        this.errorMessage = 'Por favor, carga la imagen del perfil del especialista.';
        return;
      }
      if (!this.especialidades || this.especialidades.length === 0) {
        this.errorMessage = 'Selecciona al menos una especialidad.';
        return;
      }
    } else {
      this.errorMessage = 'Por favor, selecciona un tipo de usuario.';
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, this.correo, this.contrasena);
      const user = userCredential.user;
      await sendEmailVerification(user);
      const metadata = {
        contentType: 'image/jpeg',
      };

      let imageUrl1 = '';
      let imageUrl2 = '';

      if (this.tipoSeleccionado === 'paciente') {
        const storageRef1 = ref(storage, `imagenes/Pacientes/${user.uid}_${Date.now()}_1.jpg`);
        await uploadBytes(storageRef1, this.imagenesPerfil.paciente.fotoPerfil!, metadata);
        imageUrl1 = await getDownloadURL(storageRef1);

        const storageRef2 = ref(storage, `imagenes/Pacientes/${user.uid}_${Date.now()}_2.jpg`);
        await uploadBytes(storageRef2, this.imagenesPerfil.paciente.fotoPerfil2!, metadata);
        imageUrl2 = await getDownloadURL(storageRef2);
      } else if (this.tipoSeleccionado === 'especialista') {
        const storageRef = ref(storage, `imagenes/Especialistas/${user.uid}_${Date.now()}_1.jpg`);
        await uploadBytes(storageRef, this.imagenesPerfil.especialista.fotoPerfil!, metadata);
        imageUrl1 = await getDownloadURL(storageRef);
      }

      const collectionName = this.tipoSeleccionado === 'paciente' ? 'pacientes' : 'especialistas';
      const userDoc = doc(db, collectionName, user.uid);

      const userData: any = {
        nombre: this.nombre,
        apellido: this.apellido,
        edad: Number(this.edad),
        dni: this.dni,
        correo: this.correo,
        imagenPerfil: this.tipoSeleccionado === 'paciente' ? [imageUrl1, imageUrl2] : [imageUrl1],
      };

      if (this.tipoSeleccionado === 'paciente') {
        userData.obraSocial = this.obraSocial;
      } else if (this.tipoSeleccionado === 'especialista') {
        userData.especialidades = this.especialidades;
        userData.aprobado = false;
      }

      await setDoc(userDoc, userData);

      this.router.navigate(['/login']);
    } catch (error: any) {
      if (error.code === 'auth/invalid-email') {
        this.errorMessage = 'El formato del correo es inválido.';
      } else if (error.code === 'auth/email-already-in-use') {
        this.errorMessage = 'El correo ya está registrado. Por favor, utiliza otro.';
      } else if (error.code === 'auth/weak-password') {
        this.errorMessage = 'La contraseña es demasiado débil. Debe tener al menos 6 caracteres.';
      } else {
        this.errorMessage = 'Hubo un error al registrar el usuario. Intenta nuevamente.';
      }
      console.error(error);
    }
  }

  volverLogin() {
    this.router.navigate(['/login']);
  }

  volverSeleccionTipo() {
    this.tipoSeleccionado = null;
  }
}