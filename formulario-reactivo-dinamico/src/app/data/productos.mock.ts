import { Producto } from '../models/producto.model';

export const PRODUCTOS_INICIALES: Producto[] = [
  {
    codigo: 'P001',
    nombre: 'Laptop Lenovo',
    descripcion: 'Laptop Core i5 8GB RAM',
    categoria: 'Tecnología',
    marca: 'Lenovo',
    stockMinimo: 5,
    cantidad: 20,
    precio: 750,
    fechaIngreso: '2026-03-01',
    activo: true
  },
  {
    codigo: 'P002',
    nombre: 'Mouse Logitech',
    descripcion: 'Mouse inalámbrico',
    categoria: 'Accesorios',
    marca: 'Logitech',
    stockMinimo: 10,
    cantidad: 50,
    precio: 25,
    fechaIngreso: '2026-03-02',
    activo: true
  },
  {
    codigo: 'P003',
    nombre: 'Teclado Redragon',
    descripcion: 'Teclado mecánico RGB',
    categoria: 'Accesorios',
    marca: 'Redragon',
    stockMinimo: 8,
    cantidad: 30,
    precio: 60,
    fechaIngreso: '2026-03-03',
    activo: true
  }
];