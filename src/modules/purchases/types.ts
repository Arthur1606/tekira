export interface Supplier {
  id: string;
  store_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  category: string | null;
  created_at: string;
}

export interface Purchase {
  id: string;
  store_id: string;
  supplier_id: string;
  total_amount: number;
  payment_method: string;
  status: string;
  created_by: string;
  created_at: string;
}

export interface PurchaseItem {
  id: string;
  purchase_id: string;
  variant_id: string;
  quantity: number;
  unit_cost: number;
  subtotal: number;
  created_at: string;
}
