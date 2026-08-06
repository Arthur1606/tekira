import { Insight } from './types';
import { getInventoryInsightsData, getFinancialInsightsData } from './queries';
import { getActiveCashSession } from '@/modules/transactions/services';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount);
};

const formatDateDay = (dateStr: string) => {
  const d = new Date(dateStr + 'T12:00:00Z'); // force midday to avoid timezone issues
  return new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(d);
};

export async function generateInsights(storeId: string): Promise<Insight[]> {
  const insights: Insight[] = [];
  const timestamp = new Date().toISOString();
  
  const [inventoryData, financialData, activeSession] = await Promise.all([
    getInventoryInsightsData(storeId),
    getFinancialInsightsData(storeId),
    getActiveCashSession(storeId)
  ]);

  // Priority logic weights:
  // 3: Riesgos (critical)
  // 2: Oportunidades / Positivos
  // 1: Info (neutral / warning)

  // ==========================================
  // CAJA
  // ==========================================
  if (activeSession) {
    const hoursActive = Math.floor((new Date().getTime() - new Date(activeSession.created_at).getTime()) / (1000 * 60 * 60));
    const timeStr = hoursActive > 0 ? `${hoursActive} hora${hoursActive !== 1 ? 's' : ''}` : 'menos de una hora';
    
    insights.push({
      id: 'cash-open',
      type: 'neutral',
      category: 'cash',
      title: 'Caja Operativa',
      description: `Tu caja lleva ${timeStr} activa operando.`,
      icon: 'wallet',
      timestamp
    });
  } else {
    insights.push({
      id: 'cash-closed',
      type: 'critical',
      category: 'cash',
      title: 'Apertura Requerida',
      description: 'Abre la caja ahora para registrar nuevos movimientos y mantener el control.',
      icon: 'lock',
      timestamp
    });
  }

  // ==========================================
  // FINANZAS
  // ==========================================
  const { currentPeriodIncome, previousPeriodIncome, bestDay } = financialData;
  if (previousPeriodIncome > 0) {
    const diff = currentPeriodIncome - previousPeriodIncome;
    const percentage = Math.round((Math.abs(diff) / previousPeriodIncome) * 100);

    if (diff > 0) {
      insights.push({
        id: 'finance-up',
        type: 'positive',
        category: 'finance',
        title: 'Crecimiento Financiero',
        description: `Los ingresos aumentaron un ${percentage}% respecto al periodo anterior.`,
        icon: 'trending-up',
        timestamp
      });
    } else if (diff < 0) {
      insights.push({
        id: 'finance-down',
        type: 'warning',
        category: 'finance',
        title: 'Caída de Ingresos',
        description: `Tus ingresos disminuyeron un ${percentage}% respecto a la semana pasada.`,
        icon: 'trending-down',
        timestamp
      });
    }
  }

  if (bestDay) {
    insights.push({
      id: 'finance-best',
      type: 'positive',
      category: 'finance',
      title: 'Mejor Día de Ventas',
      description: `El ${formatDateDay(bestDay.date)} fue tu mejor día de los últimos 7, con ${formatCurrency(bestDay.amount)}.`,
      icon: 'trending-up',
      timestamp
    });
  }

  // ==========================================
  // INVENTARIO
  // ==========================================
  if (inventoryData.lowStockProducts.length > 0) {
    // Only grab the most critical one
    const product = inventoryData.lowStockProducts[0];
    insights.push({
      id: 'inv-low',
      type: 'critical',
      category: 'inventory',
      title: 'Alerta de Reposición',
      description: `${product.name} tiene ${product.quantity} unidades disponibles. Considera reponer inventario.`,
      icon: 'alert-triangle',
      timestamp
    });
  }

  if (inventoryData.highestRotationProduct) {
    insights.push({
      id: 'inv-high-rot',
      type: 'positive',
      category: 'inventory',
      title: 'Producto Estrella',
      description: `${inventoryData.highestRotationProduct.name} es tu producto con mayor rotación reciente (${inventoryData.highestRotationProduct.quantity_moved} mov).`,
      icon: 'package',
      timestamp
    });
  }

  if (inventoryData.highestValueProduct) {
    insights.push({
      id: 'inv-high-val',
      type: 'neutral',
      category: 'inventory',
      title: 'Mayor Activo Inmovilizado',
      description: `${inventoryData.highestValueProduct.name} representa el mayor valor de tu inventario: ${formatCurrency(inventoryData.highestValueProduct.value)}.`,
      icon: 'dollar-sign',
      timestamp
    });
  }

  if (inventoryData.lowRotationProducts.length > 0 && !inventoryData.highestRotationProduct) {
    // Only show if we don't have better positive inventory insights to keep it brief
    const product = inventoryData.lowRotationProducts[0];
    insights.push({
      id: 'inv-rot',
      type: 'neutral',
      category: 'inventory',
      title: 'Inventario Estancado',
      description: `${product.name} no ha tenido movimiento en los últimos 30 días.`,
      icon: 'sleep',
      timestamp
    });
  }

  // Prioritization algorithm:
  const typeWeight = { critical: 300, positive: 200, warning: 100, neutral: 0 };
  
  // Sort by weight
  insights.sort((a, b) => typeWeight[b.type] - typeWeight[a.type]);

  // We need at most 3.
  const topInsights = insights.slice(0, 3);

  // In case there are no insights at all? (Very rare since cash status is always returned)
  return topInsights;
}
