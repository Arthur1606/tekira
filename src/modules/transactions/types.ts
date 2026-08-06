export type TransactionType = 'income' | 'expense';

export type IncomeCategory = 
  | 'Ventas'
  | 'Servicios'
  | 'Otros ingresos';

export type ExpenseCategory = 
  | 'Proveedores'
  | 'Nómina'
  | 'Servicios públicos'
  | 'Arriendo'
  | 'Transporte'
  | 'Impuestos'
  | 'Compras'
  | 'Mantenimiento'
  | 'Otros gastos';

export type TransactionCategory = IncomeCategory | ExpenseCategory;

export type PaymentMethod = 
  | 'efectivo'
  | 'tarjeta'
  | 'nequi'
  | 'daviplata'
  | 'transferencia'
  | 'otro';

export interface Transaction {
  id: string;
  store_id: string;
  type: TransactionType;
  amount: number;
  category: string;
  payment_method: PaymentMethod;
  description: string | null;
  cash_session_id?: string;
  product_id?: string;
  variant_id?: string;
  seller_id?: string;
  created_at: string;
}

// Constantes para los selectores en UI
export const INCOME_CATEGORIES: IncomeCategory[] = ['Ventas', 'Servicios', 'Otros ingresos'];
export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Proveedores', 'Nómina', 'Servicios públicos', 'Arriendo', 
  'Transporte', 'Impuestos', 'Compras', 'Mantenimiento', 'Otros gastos'
];
export const PAYMENT_METHODS: PaymentMethod[] = ['efectivo', 'tarjeta', 'nequi', 'daviplata', 'transferencia', 'otro'];
