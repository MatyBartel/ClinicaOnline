import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp({
      apiKey: "AIzaSyAYjraUOfAcEzoouAFEsc1yyFqF4fqx7-c",
      authDomain: "pp-labo-iv----bartel.firebaseapp.com",
      projectId: "pp-labo-iv----bartel",
      storageBucket: "pp-labo-iv----bartel.appspot.com",
      messagingSenderId: "483106802513",
      appId: "1:483106802513:web:3b6f0b00ea7e3ffa6ea170"
    })),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore())
  ]
};