import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { firebaseConfig } from '../../../firebaseConfig';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../servicios/loading.service';
import { TransicionService } from '../../servicios/transicion.service';
import { LogService } from '../../servicios/log.service';

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

  constructor(
    private router: Router, 
    private loadingService: LoadingService, 
    private transicionService: TransicionService,
    private logService: LogService
  ) {}

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
          await this.logService.registrarIngreso(userData['nombre'] + ' ' + userData['apellido'], 'Especialista');
          this.transicionService.transicionConDuracion({
            tipoUsuario: 'especialista',
            mensaje: 'Iniciando sesión como Especialista...'
          }, 2000);
          setTimeout(() => {
            this.transicionService.ocultarTransicion();
            this.router.navigate(['/miPerfil']);
            this.loginStatusChange.emit(true);
          }, 2000);
        } else {
          this.errorMessage = 'Tu cuenta de especialista aún no fue habilitada por un administrador.';
          this.loginStatusChange.emit(false);
          await signOut(this.auth);
          setTimeout(() => {}, 0);
        }
      } else if (pacienteDoc.exists()) {
        const userData = pacienteDoc.data();
        await this.logService.registrarIngreso(userData['nombre'] + ' ' + userData['apellido'], 'Paciente');
        this.transicionService.transicionConDuracion({
          tipoUsuario: 'paciente',
          mensaje: 'Iniciando sesión como Paciente...'
        }, 2000);
        setTimeout(() => {
          this.transicionService.ocultarTransicion();
          this.router.navigate(['/sacarTurno']);
          this.loginStatusChange.emit(true);
        }, 2000);
      } else if (adminDoc.exists()) {
        const userData = adminDoc.data();
        await this.logService.registrarIngreso(userData['nombre'] + ' ' + userData['apellido'], 'Administrador');
        this.transicionService.transicionConDuracion({
          tipoUsuario: 'admin',
          mensaje: 'Iniciando sesión como Administrador...'
        }, 2000);
        setTimeout(() => {
          this.transicionService.ocultarTransicion();
          this.router.navigate(['/usuarios']);
          this.loginStatusChange.emit(true);
        }, 2000);
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
