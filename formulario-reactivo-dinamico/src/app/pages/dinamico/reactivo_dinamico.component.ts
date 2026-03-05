import { Producto } from '../../models/producto.model';
import { PRODUCTOS_INICIALES } from '../../data/productos.mock';
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ValidationErrors,
  FormControl,
  FormGroupDirective,
  NgForm,
} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
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

// Validador personalizado: fecha no puede ser futura
export function fechaNoFutura(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const fecha = new Date(control.value);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  fecha.setHours(0, 0, 0, 0);
  return fecha > hoy ? { fechaFutura: true } : null;
}

// ErrorStateMatcher personalizado: muestra error si el control es inválido y ha sido tocado o modificado
export class DirtyTouchedErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(
    control: FormControl | null,
    form: FormGroupDirective | NgForm | null
  ): boolean {
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
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
    MatNativeDateModule,
  ],
  templateUrl: './reactivo_dinamico.component.html',
  styleUrls: ['./reactivo_dinamico.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ReactivoDinamicoComponent {
  matcher = new DirtyTouchedErrorStateMatcher();

  productForm: FormGroup;
  productos: Producto[] = [];
  pedidosGuardados: any[] = [];
  today: Date = new Date();
  orderForm: FormGroup;
  newItem: FormGroup;

  displayedColumns: string[] = ['producto', 'cantidad', 'precio', 'total', 'acciones'];

  constructor(private fb: FormBuilder) {
    // Formulario de producto (con validación de 2 decimales en precio)
    this.productForm = this.fb.group({
      codigo: ['', [Validators.required, Validators.pattern('^[a-zA-Z0-9]+$')]],
      nombre: ['', [Validators.required, Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$')]],
      descripcion: ['', [Validators.required, Validators.minLength(5)]],
      categoria: ['', Validators.required],
      marca: ['', [Validators.required, Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$')]],
      stockMinimo: [null, [Validators.required, Validators.min(1), Validators.pattern('^[1-9][0-9]*$')]],
      cantidad: [null, [Validators.required, Validators.min(1), Validators.pattern('^[1-9][0-9]*$')]],
      precio: [null, [Validators.required, Validators.min(0.01), Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      fechaIngreso: ['', [Validators.required, fechaNoFutura]],
      activo: [true],
    });

    this.cargarProductos();

    // Formulario de pedido
    this.orderForm = this.fb.group({
      cliente: ['', Validators.required],
      productos: this.fb.array([]),
    });

    // Formulario auxiliar para añadir items al carrito (solo productos existentes)
    this.newItem = this.fb.group({
      codigo: [''],
      producto: ['', [Validators.required, this.productoExistente.bind(this)]],
      cantidad: [1, [Validators.required, Validators.min(1), Validators.pattern('^[1-9][0-9]*$')]],
      precio: [1, [Validators.required, Validators.min(0.01), Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
    });

    this.cargarPedidos();
  }

  // Validador que comprueba si el producto existe en la lista
  productoExistente(control: AbstractControl): ValidationErrors | null {
    const nombre = control.value;
    if (!nombre) return null;
    const existe = this.productos.some(p => p.nombre === nombre);
    return existe ? null : { productoNoExiste: true };
  }

  get orderProductos(): FormArray {
    return this.orderForm.get('productos') as FormArray;
  }

  /**
   * Crea un FormGroup para un item del carrito.
   * @param item Objeto opcional con las propiedades del item (codigo, nombre, cantidad, precio)
   */
  private crearItemCarrito(item?: { codigo?: string; nombre?: string; cantidad?: number; precio?: number }): FormGroup {
    return this.fb.group({
      codigo: [item?.codigo || ''],
      producto: [item?.nombre || '', Validators.required],
      cantidad: [item?.cantidad || 1, [Validators.required, Validators.min(1), Validators.pattern('^[1-9][0-9]*$')]],
      precio: [item?.precio || 1, [Validators.required, Validators.min(0.01), Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
    });
  }

  selectedProduct(producto: Producto) {
    this.newItem.patchValue({
      codigo: producto.codigo,
      producto: producto.nombre,
      precio: producto.precio,
    });
  }

  // Ya no se usa, pero se mantiene por compatibilidad
  productoNuevo(nombre: string | null | undefined): boolean {
    return false;
  }

  // Añade una fila vacía al carrito (para uso manual, aunque ahora usamos el selector rápido)
  agregarProducto() {
    this.orderProductos.push(this.crearItemCarrito());
  }

  eliminarProductoLista(index: number) {
    const confirmar = confirm('¿Seguro que desea eliminar este producto?');
    if (!confirmar) return;
    this.productos.splice(index, 1);
    localStorage.setItem('productos', JSON.stringify(this.productos));
  }

  agregarAlCarrito() {
    if (this.newItem.invalid) {
      this.newItem.markAllAsTouched();
      return;
    }

    const value = this.newItem.value;
    const existingCtrl = this.orderProductos.controls.find(
      (ctrl) => ctrl.get('producto')?.value === value.producto
    );

    if (existingCtrl) {
      // Si ya existe, solo incrementamos la cantidad
      const currentQty = existingCtrl.get('cantidad')?.value || 0;
      existingCtrl.get('cantidad')?.setValue(currentQty + value.cantidad);
    } else {
      // Creamos un nuevo item con los datos del formulario
      this.orderProductos.push(
        this.crearItemCarrito({
          codigo: value.codigo,
          nombre: value.producto,
          cantidad: value.cantidad,
          precio: value.precio,
        })
      );
    }

    // Reiniciamos el formulario auxiliar
    this.newItem.reset({ producto: '', cantidad: 1, precio: 1 });
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
      return acc + item.cantidad * item.precio;
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
      fecha: new Date().toISOString(),
    };

    this.pedidosGuardados.push(pedido);
    localStorage.setItem('pedidos', JSON.stringify(this.pedidosGuardados));
    alert('Compra confirmada y guardada.');

    this.orderProductos.clear();
    this.orderForm.reset({ cliente: '', productos: [] });
  }

  guardarProducto() {
    if (this.productForm.invalid) return;

    const producto = { ...this.productForm.value };
    if (producto.fechaIngreso instanceof Date) {
      producto.fechaIngreso = producto.fechaIngreso.toISOString().split('T')[0];
    }

    this.productos.push(producto);
    localStorage.setItem('productos', JSON.stringify(this.productos));

    this.productForm.reset({ activo: true });
    this.productForm.markAsPristine();
    this.productForm.markAsUntouched();
    Object.keys(this.productForm.controls).forEach((key) => {
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
    } else {
      this.productos = PRODUCTOS_INICIALES;
      localStorage.setItem('productos', JSON.stringify(this.productos));
    }
  }

  cargarPedidos() {
    const data = localStorage.getItem('pedidos');
    if (data) {
      this.pedidosGuardados = JSON.parse(data);
    }
  }

  campoInvalido(campo: string): boolean {
    const control = this.productForm.get(campo);
    return !!(control?.touched && control?.invalid);
  }

  // Mensajes de error para el formulario de producto
  getError(controlName: string): string | null {
    const control = this.productForm.get(controlName);
    if (!control || !control.errors || (!control.touched && !control.dirty)) return null;

    const errors = control.errors;
    if (errors['required']) return 'Este campo es obligatorio.';
    if (errors['minlength']) return `Mínimo ${errors['minlength'].requiredLength} caracteres.`;
    if (errors['fechaFutura']) return 'La fecha no puede ser futura.';
    if (errors['pattern']) {
      switch (controlName) {
        case 'codigo': return 'Solo letras y números, sin espacios.';
        case 'nombre': case 'marca': return 'Solo letras y espacios.';
        case 'precio': return 'Formato de precio inválido (máx. 2 decimales).';
        default: return 'Formato inválido.';
      }
    }
    if (errors['min']) {
      if (controlName === 'stockMinimo' || controlName === 'cantidad') {
        return `Debe ser al menos ${errors['min'].min}.`;
      }
      if (controlName === 'precio') {
        return `El precio mínimo es ${errors['min'].min}.`;
      }
    }
    return null;
  }

  // Mensajes de error para los campos del carrito (newItem e items dinámicos)
  getErrorCarrito(control: AbstractControl | null, field: string): string | null {
    if (!control || !control.errors || (!control.touched && !control.dirty)) return null;

    const errors = control.errors;
    if (errors['required']) return 'Campo obligatorio.';
    if (errors['min']) {
      if (field === 'cantidad') return `Mínimo ${errors['min'].min} unidad(es).`;
      if (field === 'precio') return `El precio mínimo es ${errors['min'].min}.`;
    }
    if (errors['pattern']) {
      if (field === 'cantidad') return 'Formato invalido.';
      if (field === 'precio') return 'Formato de precio inválido (máx. 2 decimales).';
    }
    if (errors['productoNoExiste']) return 'El producto no existe en la lista.';
    return null;
  }
}