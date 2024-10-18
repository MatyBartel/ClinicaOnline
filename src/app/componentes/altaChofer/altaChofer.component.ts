import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ListaPaisesComponent } from '../lista-paises/lista-paises.component';
@Component({
  selector: 'app-alta-chofer',
  templateUrl: './altaChofer.component.html',
  styleUrls: ['./altaChofer.component.css'],
  imports: [ReactiveFormsModule, CommonModule, ListaPaisesComponent],
  standalone: true
})
export class AltaChoferComponent {
  choferForm: FormGroup;
  showErrors: boolean = false;

  constructor(private fb: FormBuilder) {
    this.choferForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.pattern('^[a-zA-Z ]*$')]],
      dni: ['', [Validators.required, Validators.pattern('^[0-9]{8}$')]],
      edad: ['', [Validators.required, Validators.min(18), Validators.max(50)]],
      licencia: ['', [Validators.required, Validators.minLength(7), Validators.pattern('^[0-9]*$')]],
      licenciaProfesional: [false],
      nacionalidad: ['', Validators.required]
    });
  }

  onSubmit(): void {
    this.showErrors = true;
    if (this.choferForm.valid) {
      console.log('Form submitted!', this.choferForm.value);
      this.showErrors = false;
    }
  }
}