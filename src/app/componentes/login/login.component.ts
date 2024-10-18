import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms'; 
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { initializeApp } from "firebase/app";
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

  constructor(private router: Router) {}

  // Función para autocompletar campos para Admin
  fillAdmin() {
    this.username = 'admin@correo.com';
    this.password = 'admin123';
  }

  // Función para autocompletar campos para Empleado
  fillEmpleado() {
    this.username = 'empleado@correo.com';
    this.password = 'empleado';
  }

  async onSubmit() {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, this.username, this.password);
      this.loginStatusChange.emit(true); 
      this.router.navigate(['/home']); 
    } catch (error: any) {
      switch (error.code) {
        case 'auth/invalid-credential':
          this.errorMessage = 'Correo o contraseña incorrecta.';
          break;
        case 'auth/invalid-email':
          this.errorMessage = 'Formato de correo inválido.';
          break;
        default:
          this.errorMessage = 'Error al iniciar sesión. Intenta nuevamente.';
      }
      console.error('Error en login:', error);
      this.loginStatusChange.emit(false);
    }
  }
}