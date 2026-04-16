import { supabase } from '../config/supabase';

interface CheckoutData {
  studentId: string;
  studentName: string;
  subject: string;
  level: string;
  description: string;
  durationMinutes: number;
  studentPrice: number;
  teacherRevenue: number;
  platformCommission: number;
}

export const createCheckoutSession = async (
  data: CheckoutData
): Promise<{ url: string; requestId: string }> => {
  const { data: sessionData } = await supabase.auth.getSession();

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_DATABASE_URL}/functions/v1/create-checkout-session`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionData.session?.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANNON_KEY,
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erreur lors de la creation du paiement');
  }

  return response.json();
};
