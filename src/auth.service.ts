import { getAuth, signInWithEmailAndPassword, signOut, UserCredential } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from './firebaseConfig'; 
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private app = initializeApp(firebaseConfig);
  private auth = getAuth(this.app);
  public isLoggedIn: boolean = false;

  constructor() {}

  login(email: string, password: string): Promise<UserCredential> {
    return signInWithEmailAndPassword(this.auth, email, password)
      .then(userCredential => {
        this.isLoggedIn = true;
        return userCredential;
      })
      .catch(error => {
        console.error("Error al iniciar sesión:", error);
        throw error;
      });
  }

  logout() {
    signOut(this.auth).then(() => {
      this.isLoggedIn = false;
    }).catch((error) => {
      console.error("Error al cerrar sesión:", error);
    });
  }
}