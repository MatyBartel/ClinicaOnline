import { Component, OnInit } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HttpClientModule],  // Importamos los módulos necesarios aquí
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  githubData: any = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.obtenerDatosGithub();
  }

  obtenerDatosGithub() {
    const githubUsername = 'MatyBartel'; // Cambia el usuario si es necesario
    this.http.get(`https://api.github.com/users/${githubUsername}`).subscribe(
      (data) => {
        this.githubData = data;
      },
      (error) => {
        console.error('Error al obtener los datos de GitHub', error);
      }
    );
  }
}