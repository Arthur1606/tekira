export type StoreCategory = 
  | 'Restaurante'
  | 'Comidas rápidas'
  | 'Panadería'
  | 'Cafetería'
  | 'Tienda de barrio'
  | 'Minimercado'
  | 'Supermercado'
  | 'Ferretería'
  | 'Licorería'
  | 'Droguería'
  | 'Papelería'
  | 'Peluquería'
  | 'Tienda de ropa'
  | 'Calzado'
  | 'Tecnología'
  | 'Repuestos'
  | 'Taller'
  | 'Pañalera'
  | 'Miscelánea'
  | 'Veterinaria'
  | 'Agropecuaria'
  | 'Distribuidora'
  | 'Otro';

export interface Store {
  id: string;
  name: string;
  owner_id: string;
  company_code: string;
  category: StoreCategory;
  city: string;
  created_at: string;
}
