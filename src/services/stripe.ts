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

const getAuthToken = async (): Promise<string> => {
  // Essayer de recuperer la session existante
  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData.session?.access_token) {
    return sessionData.session.access_token;
  }

  // Si pas de session, tenter un refresh
  const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
  if (refreshError || !refreshData.session?.access_token) {
    throw new Error('Session expirée. Veuillez vous reconnecter.');
  }
  return refreshData.session.access_token;
};

export const createCheckoutSession = async (
  data: CheckoutData
): Promise<{ url: string; requestId: string }> => {
  const token = await getAuthToken();

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_DATABASE_URL}/functions/v1/create-checkout-session`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANNON_KEY,
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Erreur ${response.status} lors de la creation du paiement`);
  }

  return response.json();
};
