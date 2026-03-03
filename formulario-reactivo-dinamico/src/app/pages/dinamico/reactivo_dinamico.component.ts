import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { CommonModule } from '@angular/common';

// shared product interface
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
  selector: 'app-reactivo-dinamico',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatCheckboxModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatCardModule,
    MatDividerModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './reactivo_dinamico.component.html',
  styleUrls: ['./reactivo_dinamico.component.css']
})
export class ReactivoDinamicoComponent {

  // producto reactivo (antes FormularioComponent)
  productForm: FormGroup;
  productos: Producto[] = [];
  pedidosGuardados: any[] = []; // orders saved

  // pedido/dinámico
  orderForm: FormGroup;
  newItem: FormGroup; // form for adding new cart item

  displayedColumns: string[] = ['producto', 'cantidad', 'precio', 'total', 'acciones'];

  constructor(private fb: FormBuilder) {
    // inicializar formulario de producto
    this.productForm = this.fb.group({
      codigo: ['', [Validators.required, Validators.pattern('^[a-zA-Z0-9]+$')]],
      nombre: ['', [Validators.required, Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$')]],
      descripcion: ['', [Validators.required, Validators.minLength(5)]],
      categoria: ['', Validators.required],
      marca: ['', [Validators.required, Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$')]],
      stockMinimo: [null, [Validators.required, Validators.min(1)]],
      cantidad: [null, [Validators.required, Validators.min(1)]],
      precio: [null, [Validators.required, Validators.min(0.01)]],
      fechaIngreso: ['', Validators.required],
      activo: [true]
    });
    this.cargarProductos();

    // inicializar formulario de pedido
    this.orderForm = this.fb.group({
      cliente: ['', Validators.required],
      productos: this.fb.array([])
    });

    // formulario auxiliar para añadir productos al carrito
    this.newItem = this.fb.group({
      producto: ['', Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      precio: [0, [Validators.required, Validators.min(0.01)]]
    });

    this.cargarPedidos();
  }

  // pedido form array getter (avoid naming conflict with productos list)
  get orderProductos(): FormArray {
    return this.orderForm.get('productos') as FormArray;
  }

  selectedProduct(name: string) {
    this.newItem.get('producto')?.setValue(name);
  }

  /** devuelve true si el nombre aún no figura entre los productos */
  productoNuevo(nombre: string | null | undefined): boolean {
    if (!nombre) return false;
    return !this.productos.some(p => p.nombre === nombre);
  }

  // no longer auto‑adds rows based on selection, handled by agregarAlCarrito
  nuevoProducto(): FormGroup {
    return this.fb.group({
      producto: ['', Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      precio: [0, [Validators.required, Validators.min(1)]]
    });
  }

  agregarProducto() {
    this.orderProductos.push(this.nuevoProducto());
  }

  agregarAlCarrito() {
    if (this.newItem.invalid) {
      this.newItem.markAllAsTouched();
      return;
    }
    const value = this.newItem.value;

    // if product not in master list, add it so autocomplete suggests later
    if (value.producto && !this.productos.some(p => p.nombre === value.producto)) {
      const nuevoProd: Producto = {
        codigo: value.producto,
        nombre: value.producto,
        descripcion: '',
        categoria: '',
        marca: '',
        stockMinimo: 0,
        cantidad: 0,
        precio: 0,
        fechaIngreso: new Date().toISOString().split('T')[0],
        activo: true
      };
      this.productos.push(nuevoProd);
    }

    // if product already in cart, increase quantity
    const existingCtrl = this.orderProductos.controls.find(ctrl => ctrl.get('producto')?.value === value.producto);
    if (existingCtrl) {
      const currentQty = existingCtrl.get('cantidad')?.value || 0;
      existingCtrl.get('cantidad')?.setValue(currentQty + value.cantidad);
    } else {
      this.orderProductos.push(this.fb.group({
        producto: value.producto,
        cantidad: value.cantidad,
        precio: value.precio
      }));
    }

    // reset auxiliar
    this.newItem.reset({ producto: '', cantidad: 1, precio: 0 });
  }

  eliminarProducto(index: number) {
    this.orderProductos.removeAt(index);
  }

  calcularTotal(index: number): number {
    const item = this.orderProductos.at(index).value;
    return item.cantidad * item.precio;
  }

  get totalGeneral(): number {
    return this.orderProductos.controls.reduce((acc, control) => {
      const item = control.value;
      return acc + (item.cantidad * item.precio);
    }, 0);
  }

  confirmarCompra() {
    if (this.orderForm.invalid) {
      this.orderForm.markAllAsTouched();
      return;
    }

    const pedido = {
      cliente: this.orderForm.value.cliente,
      productos: this.orderForm.value.productos,
      total: this.totalGeneral,
      fecha: new Date().toISOString()
    };

    // guardar en localStorage
    this.pedidosGuardados.push(pedido);
    localStorage.setItem('pedidos', JSON.stringify(this.pedidosGuardados));
    alert('Compra confirmada y guardada.');

    // reiniciar formulario
    this.orderProductos.clear();
    this.orderForm.reset({ cliente: '', productos: [] });
  }

  // ---------------------
  // methods for product form
  // ---------------------
  guardarProducto() {
    if (this.productForm.invalid) {
      return;
    }

    const producto = { ...this.productForm.value };
    // Asegurar que la fecha se guarde como string ISO
    if (producto.fechaIngreso instanceof Date) {
      producto.fechaIngreso = producto.fechaIngreso.toISOString().split('T')[0];
    }
    
    this.productos.push(producto);
    localStorage.setItem('productos', JSON.stringify(this.productos));
    
    // Reset form and clear validation state
    this.productForm.reset({ activo: true });
    this.productForm.markAsPristine();
    this.productForm.markAsUntouched();
    Object.keys(this.productForm.controls).forEach(key => {
      const control = this.productForm.get(key);
      if (control) {
        control.markAsUntouched();
        control.markAsPristine();
      }
    });
    
    alert('Producto guardado exitosamente');
  }

  cargarProductos() {
    const data = localStorage.getItem('productos');
    if (data) {
      this.productos = JSON.parse(data);
    }
  }

  cargarPedidos() {
    const data = localStorage.getItem('pedidos');
    if (data) {
      this.pedidosGuardados = JSON.parse(data);
    }
  }

  campoInvalido(campo: string) {
    const control = this.productForm.get(campo);
    return control?.touched && control?.invalid;
  }

  // quantity buttons removed per new design

  getError(campo: string): string | null {
    const control = this.productForm.get(campo);
    if (!control || !control.touched || !control.errors) return null;

    if (control.errors['required']) return 'Este campo es obligatorio';
    if (control.errors['minlength']) return 'Mínimo 5 caracteres';
    if (control.errors['pattern']) return 'Formato inválido';
    if (control.errors['min']) return 'Debe ser mayor que cero';

    return null;
  }
}