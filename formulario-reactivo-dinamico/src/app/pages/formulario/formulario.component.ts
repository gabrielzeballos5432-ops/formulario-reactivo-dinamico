import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface Producto {
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  marca: string;
  stockMinimo: number;
  cantidad: number;
  precio: number;
  fechaIngreso: string;
  activo: boolean;
}

@Component({
  selector: 'app-formulario',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './formulario.component.html',
  styleUrl: './formulario.component.css'
})
export class FormularioComponent {

  miFormulario: FormGroup;
  productos: Producto[] = [];

  constructor(private fb: FormBuilder) {

    this.miFormulario = this.fb.group({
      codigo: ['', [Validators.required, Validators.pattern('^[a-zA-Z0-9]+$')]],
      nombre: ['', [Validators.required, Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$')]],
      descripcion: ['', [Validators.required, Validators.minLength(5)]],
      categoria: ['', Validators.required],
      marca: ['', [Validators.required, Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$')]],
      stockMinimo: ['', [Validators.required, Validators.pattern('^[1-9]+$')]],
      cantidad: ['', [Validators.required, Validators.pattern('^[1-9]+$')]],
      precio: ['', [Validators.required, Validators.pattern('^[1-9]+(\\.[0-9]{1,2})?$')]],
      fechaIngreso: ['', Validators.required],
      activo: [true]
    });

    this.cargarProductos();
  }

  guardar() {
    if (this.miFormulario.invalid) {
      this.miFormulario.markAllAsTouched();
      return;
    }

    this.productos.push(this.miFormulario.value);
    localStorage.setItem('productos', JSON.stringify(this.productos));

    this.miFormulario.reset({ activo: true });
  }

  cargarProductos() {
    const data = localStorage.getItem('productos');
    if (data) {
      this.productos = JSON.parse(data);
    }
  }

  campoInvalido(campo: string) {
    const control = this.miFormulario.get(campo);
    return control?.touched && control?.invalid;
  }

  getError(campo: string): string | null {
    const control = this.miFormulario.get(campo);
    if (!control || !control.touched || !control.errors) return null;

    if (control.errors['required']) return 'Este campo es obligatorio';
    if (control.errors['minlength']) return 'Mínimo 5 caracteres';
    if (control.errors['pattern']) return 'Formato inválido';

    return null;
  }
}