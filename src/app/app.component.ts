import { Component, OnInit, Renderer2 } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { LoadingSpinnerComponent } from './componentes/loading-spinner/loading-spinner.component';
import { TransicionGlobalComponent } from './componentes/transicion-global/transicion-global.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, LoadingSpinnerComponent, TransicionGlobalComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'rutas';
  isLoggedIn: boolean = false;
  esAdmin: boolean = false;
  esEspecialista: boolean = false;
  esPaciente: boolean = false;

  constructor(public router: Router, private renderer: Renderer2) {}

  ngOnInit() {
    const auth = getAuth();
    const db = getFirestore();
    onAuthStateChanged(auth, async (user) => {
      this.isLoggedIn = !!user;
      if (user) {
        const adminDoc = await getDoc(doc(db, 'administradores', user.uid));
        this.esAdmin = adminDoc.exists();
        const especialistaDoc = await getDoc(doc(db, 'especialistas', user.uid));
        this.esEspecialista = especialistaDoc.exists();
        this.esPaciente = !this.esAdmin && !this.esEspecialista;
      } else {
        this.esAdmin = false;
        this.esEspecialista = false;
        this.esPaciente = false;
      }
    });
    this.router.events.subscribe(() => {
      const rutasAzul = ['/misTurnos', '/sacarTurno', '/miPerfil', '/usuarios', '/turnos'];
      if (rutasAzul.includes(this.router.url)) {
        this.renderer.addClass(document.body, 'fondo-azul-oscuro');
      } else {
        this.renderer.removeClass(document.body, 'fondo-azul-oscuro');
      }
    });
  }

  setLoginStatus(isLoggedIn: boolean) {
    this.isLoggedIn = isLoggedIn;
  }

  logout() {
    const auth = getAuth();
    signOut(auth).then(() => {
      this.isLoggedIn = false;
      this.router.navigate(['/login']);
    }).catch((error: any) => {
      console.error("Error al cerrar sesión: ", error);
    });
  }

  updateLoginStatus(isLoggedIn: boolean) {
    this.isLoggedIn = isLoggedIn;
  }

  get isLoginOrRegister() {
    return this.router.url === '/login' || this.router.url === '/registro';
  }
  redirigirALogin() {
      if (this.isLoggedIn) {
    this.logout();
  } else {
    this.router.navigate(['/login']);
  }
  }
}