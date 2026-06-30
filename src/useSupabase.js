// src/useSupabase.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';

const toDebt = (r) => ({
  id: r.id,
  category: r.category,
  name: r.name,
  totalAmount: r.total_amount,
  remainingAmount: r.remaining_amount,
  plannedPaymentAmount: r.planned_payment_amount,
  dueDate: r.due_date,
  note: r.note || '',
  status: r.status,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  totalMonths: r.total_months || null,
  paidMonths: r.paid_months || 0,
  loanType: r.loan_type || 'kredi',
  monthlyRate: r.monthly_rate || null,
});

const toPayment = (r) => ({
  id: r.id,
  debtId: r.debt_id,
  debtName: r.debt_name,
  category: r.category,
  amount: r.amount,
  paidAt: r.paid_at,
});

const DEMO = [
  {
    category: 'credit_card',
    name: 'Akbank Axess',
    total_amount: 18500,
    remaining_amount: 12300,
    planned_payment_amount: 2500,
    due_date: '2025-05-15',
    note: 'Aylık minimum ödeme.',
    status: 'active',
  },
  {
    category: 'credit_card',
    name: 'Garanti Bonus Card',
    total_amount: 9200,
    remaining_amount: 4750,
    planned_payment_amount: 1200,
    due_date: '2025-05-20',
    note: '',
    status: 'active',
  },
  {
    category: 'loan',
    name: 'İş Bankası İhtiyaç',
    total_amount: 50000,
    remaining_amount: 34200,
    planned_payment_amount: 3100,
    due_date: '2025-05-10',
    note: '36 ay vadeli.',
    status: 'active',
  },
  {
    category: 'loan',
    name: 'Yapı Kredi Taşıt',
    total_amount: 180000,
    remaining_amount: 142500,
    planned_payment_amount: 5800,
    due_date: '2025-05-08',
    note: '48 ay vadeli.',
    status: 'active',
  },
  {
    category: 'personal_debt',
    name: "Ahmet Bey'e Borç",
    total_amount: 5000,
    remaining_amount: 2000,
    planned_payment_amount: 1000,
    due_date: '2025-06-01',
    note: 'İş ortağı avansı.',
    status: 'active',
  },
];

export function useSupabase(userId) {
  const [debts, setDebts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    let mounted = true;

    const load = async () => {
      setLoading(true);

      const { data: dData, error: dErr } = await supabase
        .from('debts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (!dErr && dData?.length === 0) {
        const { data: inserted } = await supabase
          .from('debts')
          .insert(DEMO.map((d) => ({ ...d, user_id: userId })))
          .select();
        if (mounted && inserted) setDebts(inserted.map(toDebt));
      } else if (mounted && dData) {
        setDebts(dData.map(toDebt));
      }

      const { data: pData } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .order('paid_at', { ascending: false });
      if (mounted && pData) setPayments(pData.map(toPayment));
      if (mounted) setLoading(false);
    };

    load();

    const debtCh = supabase
      .channel('debts-ch')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'debts',
          filter: `user_id=eq.${userId}`,
        },
        (p) => {
          if (!mounted) return;
          if (p.eventType === 'INSERT') setDebts((d) => [...d, toDebt(p.new)]);
          if (p.eventType === 'UPDATE')
            setDebts((d) =>
              d.map((x) => (x.id === p.new.id ? toDebt(p.new) : x)),
            );
          if (p.eventType === 'DELETE')
            setDebts((d) => d.filter((x) => x.id !== p.old.id));
        },
      )
      .subscribe();

    const payCh = supabase
      .channel('pay-ch')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'payments',
          filter: `user_id=eq.${userId}`,
        },
        (p) => {
          if (mounted) setPayments((prev) => [toPayment(p.new), ...prev]);
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(debtCh);
      supabase.removeChannel(payCh);
    };
  }, [userId]);

  // ── Borç ekle: DB'ye yaz, anında local state güncelle
  const addDebt = useCallback(
    async (data) => {
      const { data: inserted, error } = await supabase
        .from('debts')
        .insert({
          user_id: userId,
          category: data.category,
          name: data.name,
          total_amount: data.totalAmount,
          remaining_amount: data.totalAmount,
          planned_payment_amount: data.plannedPaymentAmount,
          due_date: data.dueDate || null,
          note: data.note || '',
          status: 'active',
          total_months: data.totalMonths || null,
          paid_months: 0,
          loan_type: data.loanType || 'kredi',
          monthly_rate: data.monthlyRate || null,
        })
        .select()
        .single();
      if (error) throw error;
      if (inserted) setDebts((d) => [...d, toDebt(inserted)]);
    },
    [userId],
  );

  // ── Borç güncelle: DB'ye yaz, anında local state güncelle
  const updateDebt = useCallback(
    async (id, data) => {
      const u = {};
      if (data.category != null) u.category = data.category;
      if (data.name != null) u.name = data.name;
      if (data.totalAmount != null) u.total_amount = data.totalAmount;
      if (data.plannedPaymentAmount != null)
        u.planned_payment_amount = data.plannedPaymentAmount;
      if (data.dueDate != null) u.due_date = data.dueDate;
      if (data.note != null) u.note = data.note;
      if (data.remainingAmount != null)
        u.remaining_amount = data.remainingAmount;
      if (data.status != null) u.status = data.status;
      if (data.totalMonths != null) u.total_months = data.totalMonths;
      if (data.paidMonths != null) u.paid_months = data.paidMonths;
      if (data.loanType != null) u.loan_type = data.loanType;
      if (data.monthlyRate !== undefined) u.monthly_rate = data.monthlyRate;
      const { data: updated, error } = await supabase
        .from('debts')
        .update(u)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      if (updated)
        setDebts((d) => d.map((x) => (x.id === id ? toDebt(updated) : x)));
    },
    [userId],
  );

  // ── Borç sil: DB'den sil, anında local state güncelle
  const deleteDebt = useCallback(
    async (id) => {
      const { error } = await supabase
        .from('debts')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      if (error) throw error;
      setDebts((d) => d.filter((x) => x.id !== id));
      setPayments((p) => p.filter((x) => x.debtId !== id));
    },
    [userId],
  );

  // ── Ödeme yap
  const makePayment = useCallback(
    async (debtId, amount) => {
      const debt = debts.find((d) => d.id === debtId);
      if (!debt) return { success: false, error: 'Borç bulunamadı.' };
      const parsed = parseFloat(amount);
      if (!parsed || parsed <= 0)
        return { success: false, error: 'Geçerli bir tutar girin.' };
      if (parsed > debt.remainingAmount)
        return {
          success: false,
          error: 'Ödeme tutarı kalan borçtan büyük olamaz.',
        };

      // KMH: kalan = (kalan - ödeme) + (kalan - ödeme) * monthlyRate
      // Normal: kalan = kalan - ödeme
      let newRemaining;
      const isKMH = debt.loanType === 'kmh' && debt.monthlyRate;

      if (isKMH) {
        const anapara = parseFloat((debt.remainingAmount - parsed).toFixed(2));
        if (anapara <= 0) {
          newRemaining = 0;
        } else {
          const faiz = parseFloat((anapara * debt.monthlyRate).toFixed(2));
          newRemaining = parseFloat((anapara + faiz).toFixed(2));
        }
      } else {
        newRemaining = parseFloat((debt.remainingAmount - parsed).toFixed(2));
      }
      if (newRemaining < 0) newRemaining = 0;
      const newStatus = newRemaining === 0 ? 'paid' : 'active';

      const monthUpdate = { paid_months: (debt.paidMonths || 0) + 1 };
      const { data: updatedDebt, error: e1 } = await supabase
        .from('debts')
        .update({
          remaining_amount: newRemaining,
          status: newStatus,
          ...monthUpdate,
        })
        .eq('id', debtId)
        .eq('user_id', userId)
        .select()
        .single();
      if (e1) return { success: false, error: e1.message };
      if (updatedDebt)
        setDebts((d) =>
          d.map((x) => (x.id === debtId ? toDebt(updatedDebt) : x)),
        );

      const { data: newPayment, error: e2 } = await supabase
        .from('payments')
        .insert({
          user_id: userId,
          debt_id: debtId,
          debt_name: debt.name,
          category: debt.category,
          amount: parsed,
        })
        .select()
        .single();
      if (e2) return { success: false, error: e2.message };
      if (newPayment) setPayments((p) => [toPayment(newPayment), ...p]);

      return { success: true, newStatus };
    },
    [userId, debts],
  );

  // ── Personal Payments ────────────────────────────────────────────────────
  const [personalPayments, setPersonalPayments] = useState([]);
  const [ppLoading, setPpLoading] = useState(false);

  const toPA = (r) => ({
    id: r.id,
    cat: r.cat,
    name: r.name,
    amount: r.amount,
    dueDate: r.due_date,
    icon: r.icon || null,
    paid: r.paid,
    paidAt: r.paid_at,
    createdAt: r.created_at,
  });

  // Personal payments yükle
  const loadPersonalPayments = useCallback(async () => {
    if (!userId) return;
    setPpLoading(true);
    const { data, error } = await supabase
      .from('personal_payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (!error && data) setPersonalPayments(data.map(toPA));
    setPpLoading(false);
  }, [userId]);

  useEffect(() => {
    loadPersonalPayments();
  }, [loadPersonalPayments]);

  // Ödeme ekle
  const addPersonalPayment = useCallback(
    async (data) => {
      const { data: inserted, error } = await supabase
        .from('personal_payments')
        .insert({
          user_id: userId,
          cat: data.cat,
          name: data.name,
          amount: data.amount,
          due_date: data.dueDate,
          icon: data.icon || null,
          paid: false,
        })
        .select()
        .single();
      if (error) throw error;
      if (inserted) setPersonalPayments((p) => [toPA(inserted), ...p]);
    },
    [userId],
  );

  // Ödeme yap
  const payPersonalPayment = useCallback(
    async (id) => {
      const { data: updated, error } = await supabase
        .from('personal_payments')
        .update({ paid: true, paid_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      if (updated)
        setPersonalPayments((p) =>
          p.map((x) => (x.id === id ? toPA(updated) : x)),
        );
    },
    [userId],
  );

  // Ödeme sil
  const deletePersonalPayment = useCallback(
    async (id) => {
      const { error } = await supabase
        .from('personal_payments')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      if (error) throw error;
      setPersonalPayments((p) => p.filter((x) => x.id !== id));
    },
    [userId],
  );

  return {
    debts,
    payments,
    loading,
    addDebt,
    updateDebt,
    deleteDebt,
    makePayment,
    personalPayments,
    ppLoading,
    addPersonalPayment,
    payPersonalPayment,
    deletePersonalPayment,
  };
}
