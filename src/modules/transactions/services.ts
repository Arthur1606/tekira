import { createClient } from '@/lib/supabase/server';
import { Transaction } from './types';

export async function getRecentTransactions(storeId: string, limit = 5): Promise<Transaction[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }

  return data as Transaction[];
}

export async function getActiveCashSession(storeId: string) {
  const supabase = await createClient();
  
  const { data: openSession, error } = await supabase
    .from('cash_openings')
    .select('*')
    .eq('store_id', storeId)
    .eq('status', 'open')
    .maybeSingle();

  if (error) {
    console.error('Error fetching active cash session:', error);
    return null;
  }

  if (!openSession) return null;

  // Auto-curación de integridad: si la apertura tiene un registro en cash_closings, corregir status = 'closed'
  const { data: closingCheck } = await supabase
    .from('cash_closings')
    .select('id')
    .eq('opening_id', openSession.id)
    .maybeSingle();

  if (closingCheck) {
    await supabase
      .from('cash_openings')
      .update({ status: 'closed' })
      .eq('id', openSession.id);

    console.log(`[SELF-HEAL CASH]: Sesión de caja ${openSession.id} corregida a status closed.`);
    return null;
  }

  return openSession;
}

export async function getLastClosedCashSession(storeId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('cash_closings')
    .select('*, opening:cash_openings!inner(store_id, amount, created_at, status)')
    .eq('opening.store_id', storeId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching last closed session:', error);
    return null;
  }

  return data;
}

export async function getSessionBalance(sessionId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('transactions')
    .select('type, amount')
    .eq('cash_session_id', sessionId);

  if (error) {
    console.error('Error fetching session balance:', error);
    return { income: 0, expense: 0, balance: 0 };
  }

  let income = 0;
  let expense = 0;

  data.forEach((t) => {
    if (t.type === 'income') {
      income += Number(t.amount);
    } else {
      expense += Number(t.amount);
    }
  });

  return {
    income,
    expense,
    balance: income - expense
  };
}
