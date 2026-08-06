export interface FinancialMetrics {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  transactionCount: number;
}

export interface InventoryMetrics {
  totalProducts: number;
  lowStockProducts: number;
  inventoryValue: number;
}

export interface TeamMetrics {
  activeMembers: number;
  totalMembers: number;
}

export interface SalesTrend {
  date: string;
  amount: number;
}

export interface DashboardMetrics {
  financial: FinancialMetrics;
  inventory: InventoryMetrics;
  team: TeamMetrics;
  trend: SalesTrend[];
}
