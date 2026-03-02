import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-formulario-dinamico',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule
  ],
  templateUrl: './dinamico.component.html',
  styleUrls: ['./dinamico.component.css']
})
export class DinamicoComponent {

  formulario: FormGroup;

  displayedColumns: string[] = ['producto', 'cantidad', 'precio', 'total', 'acciones'];

  constructor(private fb: FormBuilder) {
    this.formulario = this.fb.group({
      cliente: ['', Validators.required],
      productos: this.fb.array([])
    });

    this.agregarProducto(); // inicia con una fila
  }

  get productos(): FormArray {
    return this.formulario.get('productos') as FormArray;
  }

  nuevoProducto(): FormGroup {
    return this.fb.group({
      producto: ['', Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      precio: [0, [Validators.required, Validators.min(1)]]
    });
  }

  agregarProducto() {
    this.productos.push(this.nuevoProducto());
  }

  eliminarProducto(index: number) {
    this.productos.removeAt(index);
  }

  calcularTotal(index: number): number {
    const item = this.productos.at(index).value;
    return item.cantidad * item.precio;
  }

  get totalGeneral(): number {
    return this.productos.controls.reduce((acc, control) => {
      const item = control.value;
      return acc + (item.cantidad * item.precio);
    }, 0);
  }

  confirmarCompra() {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const pedido = {
      cliente: this.formulario.value.cliente,
      productos: this.formulario.value.productos,
      total: this.totalGeneral
    };

    // guardar en localStorage (puedes cambiar a un servicio/API)
    localStorage.setItem('pedido', JSON.stringify(pedido));
    alert('Compra confirmada y guardada.');

    // reiniciar formulario
    this.productos.clear();
    this.formulario.reset({ cliente: '', productos: [] });
    this.agregarProducto();
  }
}