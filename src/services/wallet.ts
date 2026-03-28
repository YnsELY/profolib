import { TeacherWallet, WalletTransaction } from '../types';
import { supabase, isSupabaseConfigured } from '../config/supabase';

const DEMO_MODE = !isSupabaseConfigured;

// Cagnotte demo locale
let demoWallet: TeacherWallet | null = null;
let demoTransactions: WalletTransaction[] = [];

// Initialiser la cagnotte demo
const initDemoWallet = (teacherId: string): TeacherWallet => {
  if (!demoWallet || demoWallet.teacherId !== teacherId) {
    demoWallet = {
      id: `wallet-${teacherId}`,
      teacherId,
      balance: 125.50,
      totalEarned: 280.00,
      totalWithdrawn: 154.50,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Il y a 30 jours
      updatedAt: new Date(),
    };

    // Quelques transactions demo
    demoTransactions = [
      {
        id: 'tx-001',
        walletId: demoWallet.id,
        courseRequestId: 'demo-req-completed-001',
        type: 'earning',
        amount: 11.00,
        studentPrice: 14.00,
        teacherRevenue: 11.00,
        platformCommission: 3.00,
        description: 'Cours de 60 min - Mathematiques',
        status: 'completed',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Il y a 2 jours
      },
      {
        id: 'tx-002',
        walletId: demoWallet.id,
        courseRequestId: 'demo-req-completed-002',
        type: 'earning',
        amount: 8.50,
        studentPrice: 11.00,
        teacherRevenue: 8.50,
        platformCommission: 2.50,
        description: 'Cours de 45 min - Physique-Chimie',
        status: 'completed',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Il y a 5 jours
      },
      {
        id: 'tx-003',
        walletId: demoWallet.id,
        type: 'withdrawal',
        amount: -50.00,
        description: 'Retrait vers compte bancaire',
        status: 'completed',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Il y a 7 jours
      },
      {
        id: 'tx-004',
        walletId: demoWallet.id,
        courseRequestId: 'demo-req-completed-003',
        type: 'earning',
        amount: 5.50,
        studentPrice: 7.50,
        teacherRevenue: 5.50,
        platformCommission: 2.00,
        description: 'Cours de 30 min - Mathematiques',
        status: 'completed',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // Il y a 10 jours
      },
      {
        id: 'tx-005',
        walletId: demoWallet.id,
        type: 'bonus',
        amount: 10.00,
        description: 'Bonus de bienvenue',
        status: 'completed',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Il y a 30 jours
      },
    ];
  }

  return demoWallet;
};

// Récupérer la cagnotte d'un professeur
export const getTeacherWallet = async (teacherId: string): Promise<TeacherWallet | null> => {
  if (DEMO_MODE) {
    return initDemoWallet(teacherId);
  }

  const { data, error } = await supabase
    .from('teacher_wallets')
    .select('*')
    .eq('teacher_id', teacherId)
    .maybeSingle();

  if (error) {
    console.error('[wallet] getTeacherWallet:error', error);
    return null;
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    teacherId: data.teacher_id,
    balance: parseFloat(data.balance),
    totalEarned: parseFloat(data.total_earned),
    totalWithdrawn: parseFloat(data.total_withdrawn),
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
};

// Récupérer les transactions d'une cagnotte
export const getWalletTransactions = async (
  walletId: string,
  limit = 20
): Promise<WalletTransaction[]> => {
  if (DEMO_MODE) {
    return demoTransactions.slice(0, limit);
  }

  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('wallet_id', walletId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[wallet] getWalletTransactions:error', error);
    return [];
  }

  return (data || []).map((tx) => ({
    id: tx.id,
    walletId: tx.wallet_id,
    courseRequestId: tx.course_request_id || undefined,
    type: tx.type,
    amount: parseFloat(tx.amount),
    studentPrice: tx.student_price ? parseFloat(tx.student_price) : undefined,
    teacherRevenue: tx.teacher_revenue ? parseFloat(tx.teacher_revenue) : undefined,
    platformCommission: tx.platform_commission ? parseFloat(tx.platform_commission) : undefined,
    description: tx.description || undefined,
    status: tx.status,
    createdAt: new Date(tx.created_at),
    processedAt: tx.processed_at ? new Date(tx.processed_at) : undefined,
  }));
};

// Crediter la cagnotte du professeur apres un cours
export const creditTeacherWallet = async (
  teacherId: string,
  amount: number,
  courseRequestId: string,
  description: string,
  studentPrice?: number,
  platformCommission?: number
): Promise<void> => {
  if (DEMO_MODE) {
    // Initialiser la cagnotte si elle n'existe pas
    initDemoWallet(teacherId);

    if (!demoWallet) {
      throw new Error('Wallet not found');
    }

    // Creer la transaction
    const transaction: WalletTransaction = {
      id: `tx-${Date.now()}`,
      walletId: demoWallet.id,
      courseRequestId,
      type: 'earning',
      amount,
      studentPrice,
      teacherRevenue: amount,
      platformCommission,
      description,
      status: 'completed',
      createdAt: new Date(),
    };

    demoTransactions.unshift(transaction);

    // Mettre a jour le solde
    demoWallet.balance += amount;
    demoWallet.totalEarned += amount;
    demoWallet.updatedAt = new Date();

    console.info('[wallet] creditTeacherWallet:demo', {
      teacherId,
      amount,
      newBalance: demoWallet.balance,
    });

    return;
  }

  // En mode production, le trigger SQL gere le credit automatiquement
  // Mais on peut aussi appeler une RPC pour le faire manuellement
  const { error } = await supabase.rpc('credit_wallet_for_course', {
    p_teacher_id: teacherId,
    p_amount: amount,
    p_course_request_id: courseRequestId,
    p_description: description,
    p_student_price: studentPrice,
    p_platform_commission: platformCommission,
  });

  if (error) {
    console.error('[wallet] creditTeacherWallet:error', error);
    // Ne pas throw car le trigger devrait gerer ca
  }
};

// Demander un retrait
export const requestWithdrawal = async (
  walletId: string,
  amount: number,
  description?: string
): Promise<void> => {
  if (DEMO_MODE) {
    if (!demoWallet) {
      throw new Error('Wallet not found');
    }

    if (amount > demoWallet.balance) {
      throw new Error('Solde insuffisant');
    }

    // Créer la transaction
    const transaction: WalletTransaction = {
      id: `tx-${Date.now()}`,
      walletId,
      type: 'withdrawal',
      amount: -amount,
      description: description || 'Retrait vers compte bancaire',
      status: 'pending',
      createdAt: new Date(),
    };

    demoTransactions.unshift(transaction);

    // Mettre à jour le solde
    demoWallet.balance -= amount;
    demoWallet.totalWithdrawn += amount;
    demoWallet.updatedAt = new Date();

    return;
  }

  const { error } = await supabase
    .from('wallet_transactions')
    .insert({
      wallet_id: walletId,
      type: 'withdrawal',
      amount: -amount,
      description: description || 'Retrait vers compte bancaire',
      status: 'pending',
    });

  if (error) {
    throw error;
  }

  // Mettre à jour le solde de la cagnotte
  await supabase.rpc('process_withdrawal', { wallet_id: walletId, withdrawal_amount: amount });
};
