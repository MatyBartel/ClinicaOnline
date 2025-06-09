import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { getAuth, createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from 'firebase/auth';
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
  especialidadSeleccionada: string = '';
  obraSocial: string = '';
  nuevaEspecialidad: string = ''; // Variable para la nueva especialidad ingresada
  errorMessage: string = '';

  imagenesPerfil: any = {
    paciente: {
      fotoPerfil: null,
      fotoPerfil2: null
    },
    especialista: {
      fotoPerfil: null
    }
  };
  especialidades: string[] = ['Odontologo', 'Pediatra', 'Kinesiologo', 'Cardiologo'];  // Lista inicial de especialidades

  constructor(private router: Router) { }

  seleccionarTipo(tipo: string) {
    this.tipoSeleccionado = tipo;
  }

  // Función para agregar nueva especialidad
  agregarEspecialidad() {
    if (this.nuevaEspecialidad.trim() !== '') {
      this.especialidades.push(this.nuevaEspecialidad.trim());
      this.nuevaEspecialidad = '';  // Limpiar el campo de nueva especialidad
    }
  }

  onImageSelected(event: Event, tipo: string, campo: string) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagenesPerfil[tipo][campo] = e.target?.result; // Guardar la imagen como URL de datos (data URL)
      };
      reader.readAsDataURL(file); // Convierte el archivo a una URL de datos
    }
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

    // Validación de campos obligatorios
    if (!this.nombre || !this.apellido || !this.dni || !this.edad) {
      this.errorMessage = 'Todos los campos son obligatorios.';
      return;
    }

    const correo = this.correo;
    const contrasena = this.contrasena;

    if (!correo || !contrasena) {
      this.errorMessage = 'Correo y contraseña son obligatorios.';
      return;
    }

    // Verificar si el correo ya existe
    try {
      if (await this.verificarCorreoExistente(correo)) {
        this.errorMessage = 'El correo ya está registrado. Por favor, utiliza otro.';
        return;
      }
    } catch (error) {
      this.errorMessage = 'Error al verificar el correo. Intenta nuevamente.';
      return;
    }

    // Validación de formato de correo
    const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
    if (!correoValido) {
      this.errorMessage = 'El formato del correo es inválido.';
      return;
    }

    // Validar las imágenes basadas en el tipo de usuario seleccionado
    if (this.tipoSeleccionado === 'paciente') {
      if (!this.imagenesPerfil.paciente.fotoPerfil || !this.imagenesPerfil.paciente.fotoPerfil2) {
        this.errorMessage = 'Por favor, carga ambas imágenes del perfil del paciente.';
        return;
      }
    } else if (this.tipoSeleccionado === 'especialista') {
      if (!this.imagenesPerfil.especialista.fotoPerfilEsp) {
        this.errorMessage = 'Por favor, carga la imagen del perfil del especialista.';
        return;
      }
    }

    try {
            // Crear usuario en Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, correo, contrasena);
            const user = userCredential.user;
        
            // Subir imágenes a Firebase Storage
            let imageUrl1, imageUrl2;
            const metadata = {
              contentType: 'image/jpeg', // Asegúrate de usar el tipo MIME correcto
            };
        
            if (this.tipoSeleccionado === 'paciente') {
              const storageRef1 = ref(storage, `imagenes/Pacientes/${user.uid}_${Date.now()}_1`);
              const fileSnapshot1 = await uploadBytes(storageRef1, this.imagenesPerfil.paciente.fotoPerfil, metadata);
              imageUrl1 = await getDownloadURL(fileSnapshot1.ref);
        
              const storageRef2 = ref(storage, `imagenes/Pacientes/${user.uid}_${Date.now()}_2`);
              const fileSnapshot2 = await uploadBytes(storageRef2, this.imagenesPerfil.paciente.fotoPerfil2, metadata);
              imageUrl2 = await getDownloadURL(fileSnapshot2.ref);
            } else if (this.tipoSeleccionado === 'especialista') {
              const storageRef1 = ref(storage, `imagenes/Especialistas/${user.uid}_${Date.now()}_1`);
              const fileSnapshot1 = await uploadBytes(storageRef1, this.imagenesPerfil.especialista.fotoPerfilEsp, metadata);
              imageUrl1 = await getDownloadURL(fileSnapshot1.ref);
            }
        
            // Crear documento en Firestore
            const collectionName = this.tipoSeleccionado === 'paciente' ? 'pacientes' : 'especialistas';
            const userDoc = doc(db, collectionName, user.uid);
        
            // Registrar la información del usuario
            const userData: any = {
              nombre: this.nombre,
              apellido: this.apellido,
              edad: this.edad,
              dni: this.dni,
              correo: correo,
              imagenPerfil: this.tipoSeleccionado === 'paciente' ? [imageUrl1, imageUrl2] : [imageUrl1],
            };
        
            if (this.tipoSeleccionado === 'paciente') {
              userData.obraSocial = this.obraSocial;
            } else if (this.tipoSeleccionado === 'especialista') {
              userData.especialidad = this.especialidadSeleccionada;
            }
      // Guardar en Firestore
      await setDoc(userDoc, userData);

      // Redirigir al login
      this.router.navigate(['/login']);
    } catch (error: any) {
      // Manejo de errores
      if (error.code === 'auth/invalid-email') {
        this.errorMessage = 'El formato del correo es inválido.';
      } else if (error.code === 'auth/email-already-in-use') {
        this.errorMessage = 'El correo ya está registrado. Por favor, utiliza otro.';
      } else if (error.code === 'auth/weak-password') {
        this.errorMessage = 'La contraseña es demasiado débil. Debe tener al menos 6 caracteres.';
      } else {
        this.errorMessage = 'Hubo un error al registrar el usuario. Intenta nuevamente.';
      }
    }
  }

  volverLogin() {
    this.router.navigate(['/login']); // O la ruta que tengas configurada para el login 
  }

  volverSeleccionTipo() {
    this.tipoSeleccionado = null; // Resetear tipo seleccionado
  }
}