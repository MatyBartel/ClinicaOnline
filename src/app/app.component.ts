import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LoginComponent } from './componentes/login/login.component'; 
import { CommonModule } from '@angular/common';
import { HomeComponent } from './componentes/home/home.component';

import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, LoginComponent, HomeComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'rutas';
  isLoggedIn: boolean = false;

  constructor(public router: Router) {}

  ngOnInit() {
    const auth = getAuth();
    
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.isLoggedIn = true;
      } else {
        this.isLoggedIn = false;
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
}