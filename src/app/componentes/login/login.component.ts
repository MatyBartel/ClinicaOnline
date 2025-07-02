import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { firebaseConfig } from '../../../firebaseConfig';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  @Output() loginStatusChange = new EventEmitter<boolean>();
  username: string = '';
  password: string = '';
  errorMessage: string = '';

  app = initializeApp(firebaseConfig);
  auth = getAuth(this.app);
  db = getFirestore(this.app);

  constructor(private router: Router) {}

  fillPaciente1() {
    this.username = 'manuelPaciente1@gmail.com';
    this.password = 'paciente123';
  }
  fillPaciente2() {
    this.username = 'juanPaciente2@gmail.com';
    this.password = 'paciente123';
  }
  fillPaciente3() {
    this.username = 'carlosPaciente3@gmail.com';
    this.password = 'paciente123';
  }

  fillEspecialista1() {
    this.username = 'matiasMedico@gmail.com';
    this.password = '123456';
  }
  fillEspecialista2() {
    this.username = 'especialistaJuan@gmail.com';
    this.password = 'juan123';
  }

  fillAdmin() {
    this.username = 'admin@correo.com';
    this.password = 'admin123';
  }

  async onSubmit() {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, this.username, this.password);
      const user = userCredential.user;
  
      const especialistasRef = doc(this.db, 'especialistas', user.uid);
      const pacientesRef = doc(this.db, 'pacientes', user.uid);
      const administradoresRef = doc(this.db, 'administradores', user.uid);
  
      const [especialistaDoc, pacienteDoc, adminDoc] = await Promise.all([
        getDoc(especialistasRef),
        getDoc(pacientesRef),
        getDoc(administradoresRef)
      ]);
  
      if (especialistaDoc.exists()) {
        const userData = especialistaDoc.data();
        if (userData['aprobado']) {
          this.router.navigate(['/miPerfil']);
          this.loginStatusChange.emit(true);
        } else {
          this.errorMessage = 'Tu cuenta de especialista aún no fue habilitada por un administrador.';
          this.loginStatusChange.emit(false);
        }
      } else if (pacienteDoc.exists()) {
        const userData = pacienteDoc.data();
        this.router.navigate(['/sacarTurno']);
        this.loginStatusChange.emit(true);
      } else if (adminDoc.exists()) {
        const userData = adminDoc.data();
        this.router.navigate(['/usuarios']);
        this.loginStatusChange.emit(true);
      } else {
        this.errorMessage = 'No se encontró el usuario en la base de datos.';
        this.loginStatusChange.emit(false);
      }
  
    } catch (error: any) {
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          this.errorMessage = 'Correo o contraseña incorrecta.';
          break;
        case 'auth/invalid-email':
          this.errorMessage = 'Formato de correo inválido.';
          break;
        case 'auth/invalid-credential':
          this.errorMessage = 'Usuario inexistente'
          break;
        default:
          this.errorMessage = 'Error al iniciar sesión. Intenta nuevamente.';
      }
      console.error('Error en login:', error);
      this.loginStatusChange.emit(false);
    }
  }
}
