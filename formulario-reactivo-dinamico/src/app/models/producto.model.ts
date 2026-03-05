export interface Producto {
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