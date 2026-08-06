export type InsightType = 'positive' | 'warning' | 'critical' | 'neutral';
export type InsightCategory = 'finance' | 'inventory' | 'cash';

export interface Insight {
  id: string;
  type: InsightType;
  category: InsightCategory;
  title: string;
  description: string;
  icon: string; // Name of the icon to map in the UI
  timestamp: string; // ISO date string
}

export interface InventoryInsightsData {
  lowStockProducts: { id: string; name: string; quantity: number }[];
  lowRotationProducts: { id: string; name: string }[];
  highestRotationProduct: { id: string; name: string; quantity_moved: number } | null;
  highestValueProduct: { id: string; name: string; value: number } | null;
}

export interface FinancialInsightsData {
  currentPeriodIncome: number; // Last 7 days
  previousPeriodIncome: number; // Previous 7 days
  bestDay: { date: string; amount: number } | null;
}
