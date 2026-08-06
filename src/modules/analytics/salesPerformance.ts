import { createClient } from '@/lib/supabase/server';

export interface EmployeeSalesPerformance {
  userId: string | null;
  employeeCode: string;
  name: string;
  role: string;
  totalSalesValue: number;
  totalTransactions: number;
  totalItemsCount: number;
  lastSaleDate: string | null;
}

export async function getTeamSalesPerformance(storeId: string): Promise<EmployeeSalesPerformance[]> {
  const supabase = await createClient();

  // 1. Obtener todos los integrantes del equipo
  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('user_id, name, role, employee_code')
    .eq('store_id', storeId)
    .eq('status', 'active');

  if (!teamMembers || teamMembers.length === 0) return [];

  // 2. Obtener transacciones de ingresos asociadas a la empresa
  const { data: sales } = await supabase
    .from('transactions')
    .select('user_id, employee_code, amount, created_at')
    .eq('store_id', storeId)
    .eq('type', 'income');

  const performanceMap: Record<string, EmployeeSalesPerformance> = {};

  // Inicializar mapa por integrante
  teamMembers.forEach(member => {
    const key = member.employee_code || member.user_id || member.name;
    performanceMap[key] = {
      userId: member.user_id,
      employeeCode: member.employee_code || 'TKR-EMP-000001',
      name: member.name,
      role: member.role,
      totalSalesValue: 0,
      totalTransactions: 0,
      totalItemsCount: 0,
      lastSaleDate: null
    };
  });

  // Procesar ventas
  if (sales && sales.length > 0) {
    sales.forEach(sale => {
      const code = sale.employee_code;
      const matchedKey = Object.keys(performanceMap).find(
        k => k === code || performanceMap[k].userId === sale.user_id
      );

      if (matchedKey && performanceMap[matchedKey]) {
        const perf = performanceMap[matchedKey];
        perf.totalSalesValue += Number(sale.amount || 0);
        perf.totalTransactions += 1;
        perf.totalItemsCount += 1; // 1 unidad o item por transacción

        if (!perf.lastSaleDate || new Date(sale.created_at) > new Date(perf.lastSaleDate)) {
          perf.lastSaleDate = sale.created_at;
        }
      }
    });
  }

  return Object.values(performanceMap).sort((a, b) => b.totalSalesValue - a.totalSalesValue);
}
