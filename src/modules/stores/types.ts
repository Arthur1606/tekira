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
  status: 'active' | 'suspended' | 'blocked';
  logo_url?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  currency: string;
  timezone: string;
  created_at: string;
}
