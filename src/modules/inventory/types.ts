export type ProductStatus = 'available' | 'low_stock' | 'out_of_stock';
export type MovementType = 'entry' | 'exit' | 'sale' | 'damage' | 'loss' | 'discontinued';

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  sku?: string;
  barcode?: string;
  attributes?: Record<string, string>;
  quantity: number;
  cost: number;
  sale_price: number;
  created_at: string;
}

export interface Product {
  id: string;
  store_id: string;
  name: string;
  sku?: string;
  category: string;
  quantity: number;
  unit: string;
  min_stock: number;
  status: ProductStatus;
  deleted_at?: string | null;
  deleted_by?: string | null;
  delete_reason?: string | null;
  created_at: string;
  variants?: ProductVariant[];
}

export interface InventoryMovement {
  id: string;
  product_id?: string;
  variant_id?: string;
  type: MovementType;
  quantity: number;
  reason: string;
  created_at: string;
}

export const PRODUCT_UNITS = [
  'unidades',
  'kg',
  'gramos',
  'litros',
  'ml',
  'metros',
  'cm',
  'cajas',
  'paquetes',
  'piezas',
  'otro'
];

export const PRODUCT_CATEGORIES = [
  'Ropa',
  'Calzado',
  'Accesorios',
  'Alimentos',
  'Bebidas',
  'Aseo',
  'Tecnología',
  'Ferretería',
  'Papelería',
  'Hogar',
  'Salud',
  'Belleza',
  'Mascotas',
  'Repuestos',
  'Otros'
];

export const DECIMAL_UNITS = ['kg', 'kilo', 'kilogramo', 'kilogramos', 'gramos', 'litros', 'ml', 'metros', 'cm', 'libras', 'lb', 'g', 'l', 'm'];

export function getQuantityStep(unit?: string): string {
  if (!unit) return '1';
  const u = unit.toLowerCase().trim();
  if (DECIMAL_UNITS.includes(u)) {
    return '0.01';
  }
  return '1';
}

export function formatQuantity(quantity: number, unit?: string): string {
  const step = getQuantityStep(unit);
  if (step === '1') {
    return Math.round(quantity).toString();
  }
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(quantity);
}
