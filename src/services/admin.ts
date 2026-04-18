import { supabase, isSupabaseConfigured } from '../config/supabase';
import {
  User,
  TeacherRegistration,
  TeacherWallet,
  TeacherWalletWithInfo,
  PaymentWithDetails,
  AdminDashboardStats,
} from '../types';

// Données mock pour le mode démo
const MOCK_USERS: User[] = [
  { id: 'student-1', email: 'lucas@demo.com', name: 'Lucas Martin', role: 'student', createdAt: new Date('2024-01-15') },
  { id: 'student-2', email: 'emma@demo.com', name: 'Emma Dubois', role: 'student', createdAt: new Date('2024-02-10') },
  { id: 'student-3', email: 'thomas@demo.com', name: 'Thomas Bernard', role: 'student', createdAt: new Date('2024-03-05') },
  { id: 'teacher-1', email: 'marie@demo.com', name: 'Marie Dupont', role: 'teacher', subjects: ['Mathematiques', 'Physique-Chimie'], approved: true, createdAt: new Date('2024-01-20') },
  { id: 'teacher-2', email: 'pierre@demo.com', name: 'Pierre Leroy', role: 'teacher', subjects: ['Anglais', 'Espagnol'], approved: true, createdAt: new Date('2024-02-15') },
  { id: 'teacher-3', email: 'sophie@demo.com', name: 'Sophie Petit', role: 'teacher', subjects: ['Francais', 'Histoire-Geographie'], approved: true, createdAt: new Date('2024-03-01') },
];

const MOCK_PENDING_REGISTRATIONS: TeacherRegistration[] = [
  {
    id: 'reg-1',
    email: 'jean.durand@email.com',
    name: 'Jean Durand',
    subjects: ['Mathematiques', 'Informatique'],
    experience: '5 ans de professeur particulier',
    motivation: 'Je souhaite aider les élèves à progresser en mathématiques et découvrir la programmation.',
    status: 'pending',
    createdAt: new Date('2024-03-10'),
  },
  {
    id: 'reg-2',
    email: 'claire.moreau@email.com',
    name: 'Claire Moreau',
    subjects: ['Physique-Chimie', 'SVT'],
    diplomas: 'Doctorat en physique, agrégation',
    experience: '10 ans dans l\'enseignement secondaire',
    motivation: 'Passionnée par les sciences, je veux rendre la physique accessible à tous.',
    status: 'pending',
    createdAt: new Date('2024-03-12'),
  },
];

const MOCK_WALLETS: TeacherWalletWithInfo[] = [
  { id: 'wallet-1', teacherId: 'teacher-1', teacherName: 'Marie Dupont', teacherEmail: 'marie@demo.com', balance: 245.50, totalEarned: 1250.00, totalWithdrawn: 1004.50, createdAt: new Date('2024-01-20'), updatedAt: new Date('2024-03-15') },
  { id: 'wallet-2', teacherId: 'teacher-2', teacherName: 'Pierre Leroy', teacherEmail: 'pierre@demo.com', balance: 189.00, totalEarned: 890.00, totalWithdrawn: 701.00, createdAt: new Date('2024-02-15'), updatedAt: new Date('2024-03-14') },
  { id: 'wallet-3', teacherId: 'teacher-3', teacherName: 'Sophie Petit', teacherEmail: 'sophie@demo.com', balance: 312.75, totalEarned: 1560.00, totalWithdrawn: 1247.25, createdAt: new Date('2024-03-01'), updatedAt: new Date('2024-03-15') },
];

const MOCK_PAYMENTS: PaymentWithDetails[] = [
  { id: 'pay-1', courseRequestId: 'req-1', studentId: 'student-1', studentName: 'Lucas Martin', teacherName: 'Marie Dupont', subject: 'Mathematiques', durationMinutes: 30, amount: 7.50, platformCommission: 2.00, teacherRevenue: 5.50, status: 'paid', paidAt: new Date('2024-03-15'), createdAt: new Date('2024-03-15') },
  { id: 'pay-2', courseRequestId: 'req-2', studentId: 'student-2', studentName: 'Emma Dubois', teacherName: 'Pierre Leroy', subject: 'Anglais', durationMinutes: 45, amount: 11.00, platformCommission: 2.50, teacherRevenue: 8.50, status: 'paid', paidAt: new Date('2024-03-14'), createdAt: new Date('2024-03-14') },
  { id: 'pay-3', courseRequestId: 'req-3', studentId: 'student-3', studentName: 'Thomas Bernard', teacherName: 'Marie Dupont', subject: 'Physique-Chimie', durationMinutes: 60, amount: 14.00, platformCommission: 3.00, teacherRevenue: 11.00, status: 'paid', paidAt: new Date('2024-03-13'), createdAt: new Date('2024-03-13') },
  { id: 'pay-4', courseRequestId: 'req-4', studentId: 'student-1', studentName: 'Lucas Martin', teacherName: 'Sophie Petit', subject: 'Francais', durationMinutes: 20, amount: 5.00, platformCommission: 1.50, teacherRevenue: 3.50, status: 'paid', paidAt: new Date('2024-03-12'), createdAt: new Date('2024-03-12') },
  { id: 'pay-5', courseRequestId: 'req-5', studentId: 'student-2', studentName: 'Emma Dubois', teacherName: 'Sophie Petit', subject: 'Histoire-Geographie', durationMinutes: 45, amount: 11.00, platformCommission: 2.50, teacherRevenue: 8.50, status: 'pending', createdAt: new Date('2024-03-15') },
];

// ========== GESTION DES UTILISATEURS ==========

export const getAllUsers = async (): Promise<User[]> => {
  if (!isSupabaseConfigured) {
    return MOCK_USERS;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(mapProfileToUser);
};

export const getUsersByRole = async (role: 'student' | 'teacher' | 'admin'): Promise<User[]> => {
  if (!isSupabaseConfigured) {
    return MOCK_USERS.filter(u => u.role === role);
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', role)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(mapProfileToUser);
};

export const getUserById = async (id: string): Promise<User | null> => {
  if (!isSupabaseConfigured) {
    return MOCK_USERS.find(u => u.id === id) || null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;

  return data ? mapProfileToUser(data) : null;
};

// ========== GESTION DES INSCRIPTIONS PROFESSEURS ==========

export const getPendingRegistrations = async (): Promise<TeacherRegistration[]> => {
  if (!isSupabaseConfigured) {
    return MOCK_PENDING_REGISTRATIONS;
  }

  const { data, error } = await supabase
    .from('teacher_registrations')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(mapRegistrationToType);
};

export const getAllRegistrations = async (): Promise<TeacherRegistration[]> => {
  if (!isSupabaseConfigured) {
    return [...MOCK_PENDING_REGISTRATIONS];
  }

  const { data, error } = await supabase
    .from('teacher_registrations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(mapRegistrationToType);
};

export const approveRegistration = async (
  registrationId: string,
  adminId: string,
  notes?: string
): Promise<void> => {
  if (!isSupabaseConfigured) {
    const reg = MOCK_PENDING_REGISTRATIONS.find(r => r.id === registrationId);
    if (reg) {
      reg.status = 'approved';
      reg.reviewedBy = adminId;
      reg.reviewNotes = notes;
      reg.reviewedAt = new Date();
    }
    return;
  }

  // 1. Mettre a jour la demande d'inscription et recuperer l'email
  const { data: registration, error } = await supabase
    .from('teacher_registrations')
    .update({
      status: 'approved',
      reviewed_by: adminId,
      review_notes: notes,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', registrationId)
    .select('email')
    .single();

  if (error) throw error;

  // 2. Activer le profil du professeur (approved = true)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .update({ approved: true })
    .eq('email', registration.email)
    .eq('role', 'teacher')
    .select('id')
    .maybeSingle();

  if (profileError) {
    console.error('[admin] approveRegistration:profile:error', profileError);
  }

  // 3. Creer le wallet du professeur si son profil existe
  if (profile) {
    const { error: walletError } = await supabase
      .from('teacher_wallets')
      .upsert(
        { teacher_id: profile.id, balance: 0, total_earned: 0, total_withdrawn: 0 },
        { onConflict: 'teacher_id' }
      );
    if (walletError) {
      console.error('[admin] approveRegistration:wallet:error', walletError);
    }
  }
};

export const rejectRegistration = async (
  registrationId: string,
  adminId: string,
  reason: string
): Promise<void> => {
  if (!isSupabaseConfigured) {
    const reg = MOCK_PENDING_REGISTRATIONS.find(r => r.id === registrationId);
    if (reg) {
      reg.status = 'rejected';
      reg.reviewedBy = adminId;
      reg.reviewNotes = reason;
      reg.reviewedAt = new Date();
    }
    return;
  }

  const { error } = await supabase
    .from('teacher_registrations')
    .update({
      status: 'rejected',
      reviewed_by: adminId,
      review_notes: reason,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', registrationId);

  if (error) throw error;
};

// Soumettre une inscription professeur
export const submitTeacherRegistration = async (
  registration: Omit<TeacherRegistration, 'id' | 'status' | 'createdAt'>
): Promise<void> => {
  if (!isSupabaseConfigured) {
    MOCK_PENDING_REGISTRATIONS.push({
      ...registration,
      id: `reg-${Date.now()}`,
      status: 'pending',
      createdAt: new Date(),
    });
    return;
  }

  const { error } = await supabase.from('teacher_registrations').insert({
    email: registration.email,
    name: registration.name,
    subjects: registration.subjects,
    diplomas: registration.diplomas,
    experience: registration.experience,
    motivation: registration.motivation,
    status: 'pending',
  });

  if (error) throw error;
};

// ========== GESTION DES CAGNOTTES ==========

export const getAllWallets = async (): Promise<TeacherWalletWithInfo[]> => {
  if (!isSupabaseConfigured) {
    return MOCK_WALLETS;
  }

  const { data, error } = await supabase
    .from('teacher_wallets')
    .select(`
      *,
      teacher:teacher_id (name, email)
    `)
    .order('updated_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((w: Record<string, unknown>) => ({
    id: w.id as string,
    teacherId: w.teacher_id as string,
    teacherName: (w.teacher as Record<string, string>)?.name || '',
    teacherEmail: (w.teacher as Record<string, string>)?.email || '',
    balance: w.balance as number,
    totalEarned: w.total_earned as number,
    totalWithdrawn: w.total_withdrawn as number,
    createdAt: new Date(w.created_at as string),
    updatedAt: new Date(w.updated_at as string),
  }));
};

export const getWalletByTeacherId = async (teacherId: string): Promise<TeacherWallet | null> => {
  if (!isSupabaseConfigured) {
    const wallet = MOCK_WALLETS.find(w => w.teacherId === teacherId);
    return wallet || null;
  }

  const { data, error } = await supabase
    .from('teacher_wallets')
    .select('*')
    .eq('teacher_id', teacherId)
    .maybeSingle();

  if (error) throw error;

  return data ? mapWalletToType(data) : null;
};

// Effectuer un retrait pour un professeur (admin)
export const processWithdrawal = async (
  walletId: string,
  amount: number,
  adminId: string,
  description?: string
): Promise<void> => {
  if (!isSupabaseConfigured) {
    const wallet = MOCK_WALLETS.find(w => w.id === walletId);
    if (wallet) {
      wallet.balance -= amount;
      wallet.totalWithdrawn += amount;
      wallet.updatedAt = new Date();
    }
    return;
  }

  // Utiliser une transaction RPC si disponible, sinon faire en deux étapes
  const { data: wallet, error: walletError } = await supabase
    .from('teacher_wallets')
    .select('*')
    .eq('id', walletId)
    .single();

  if (walletError) throw walletError;

  const newBalance = (wallet.balance as number) - amount;
  const newTotalWithdrawn = (wallet.total_withdrawn as number) + amount;

  const { error: updateError } = await supabase
    .from('teacher_wallets')
    .update({
      balance: newBalance,
      total_withdrawn: newTotalWithdrawn,
      updated_at: new Date().toISOString(),
    })
    .eq('id', walletId);

  if (updateError) throw updateError;

  // Créer la transaction
  const { error: txError } = await supabase.from('wallet_transactions').insert({
    wallet_id: walletId,
    type: 'withdrawal',
    amount: -amount,
    description: description || 'Retrait effectué par l\'administrateur',
    status: 'completed',
    processed_by: adminId,
    processed_at: new Date().toISOString(),
  });

  if (txError) throw txError;
};

// ========== GESTION DES PAIEMENTS ET STATISTIQUES ==========

export const getAllPayments = async (): Promise<PaymentWithDetails[]> => {
  if (!isSupabaseConfigured) {
    return MOCK_PAYMENTS;
  }

  const { data, error } = await supabase
    .from('payments')
    .select(`
      *,
      student:student_id (name),
      course_request:course_request_id (subject, duration_minutes, teacher_name)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((p: Record<string, unknown>) => ({
    id: p.id as string,
    courseRequestId: p.course_request_id as string,
    studentId: p.student_id as string,
    studentName: (p.student as Record<string, string>)?.name || '',
    teacherName: (p.course_request as Record<string, string>)?.teacher_name,
    subject: (p.course_request as Record<string, string>)?.subject || '',
    durationMinutes: (p.course_request as Record<string, number>)?.duration_minutes || 0,
    amount: p.amount as number,
    platformCommission: p.platform_commission as number,
    teacherRevenue: p.teacher_revenue as number,
    paymentMethod: p.payment_method as string | undefined,
    paymentIntentId: p.payment_intent_id as string | undefined,
    status: p.status as PaymentWithDetails['status'],
    paidAt: p.paid_at ? new Date(p.paid_at as string) : undefined,
    refundedAt: p.refunded_at ? new Date(p.refunded_at as string) : undefined,
    createdAt: new Date(p.created_at as string),
  }));
};

export const getDashboardStats = async (): Promise<AdminDashboardStats> => {
  if (!isSupabaseConfigured) {
    const totalRevenue = MOCK_PAYMENTS
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
    const totalTeacherRevenue = MOCK_PAYMENTS
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.teacherRevenue, 0);
    const totalPlatformCommission = MOCK_PAYMENTS
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.platformCommission, 0);

    return {
      totalUsers: MOCK_USERS.length,
      totalStudents: MOCK_USERS.filter(u => u.role === 'student').length,
      totalTeachers: MOCK_USERS.filter(u => u.role === 'teacher').length,
      pendingRegistrations: MOCK_PENDING_REGISTRATIONS.filter(r => r.status === 'pending').length,
      totalRevenue,
      totalTeacherRevenue,
      totalPlatformCommission,
      totalPayments: MOCK_PAYMENTS.filter(p => p.status === 'paid').length,
      recentPayments: MOCK_PAYMENTS.slice(0, 5),
    };
  }

  // Récupérer toutes les statistiques en parallèle
  const [
    { count: totalUsers },
    { count: totalStudents },
    { count: totalTeachers },
    { count: pendingRegistrations },
    { data: payments },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
    supabase.from('teacher_registrations').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase
      .from('payments')
      .select(`
        *,
        student:student_id (name),
        course_request:course_request_id (subject, duration_minutes, teacher_name)
      `)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  // Calculer les totaux
  const { data: allPayments } = await supabase
    .from('payments')
    .select('amount, platform_commission, teacher_revenue, status')
    .eq('status', 'paid');

  const totalRevenue = (allPayments || []).reduce((sum, p) => sum + (p.amount as number), 0);
  const totalTeacherRevenue = (allPayments || []).reduce((sum, p) => sum + (p.teacher_revenue as number), 0);
  const totalPlatformCommission = (allPayments || []).reduce((sum, p) => sum + (p.platform_commission as number), 0);

  return {
    totalUsers: totalUsers || 0,
    totalStudents: totalStudents || 0,
    totalTeachers: totalTeachers || 0,
    pendingRegistrations: pendingRegistrations || 0,
    totalRevenue,
    totalTeacherRevenue,
    totalPlatformCommission,
    totalPayments: (allPayments || []).length,
    recentPayments: (payments || []).map((p: Record<string, unknown>) => ({
      id: p.id as string,
      courseRequestId: p.course_request_id as string,
      studentId: p.student_id as string,
      studentName: (p.student as Record<string, string>)?.name || '',
      teacherName: (p.course_request as Record<string, string>)?.teacher_name,
      subject: (p.course_request as Record<string, string>)?.subject || '',
      durationMinutes: (p.course_request as Record<string, number>)?.duration_minutes || 0,
      amount: p.amount as number,
      platformCommission: p.platform_commission as number,
      teacherRevenue: p.teacher_revenue as number,
      status: p.status as PaymentWithDetails['status'],
      paidAt: p.paid_at ? new Date(p.paid_at as string) : undefined,
      createdAt: new Date(p.created_at as string),
    })),
  };
};

// ========== UTILITAIRES ==========

const mapProfileToUser = (profile: Record<string, unknown>): User => ({
  id: profile.id as string,
  email: profile.email as string,
  name: profile.name as string,
  role: profile.role as User['role'],
  subjects: profile.subjects as string[] | undefined,
  approved: profile.approved as boolean | undefined,
  createdAt: new Date(profile.created_at as string),
});

const mapRegistrationToType = (reg: Record<string, unknown>): TeacherRegistration => ({
  id: reg.id as string,
  email: reg.email as string,
  name: reg.name as string,
  subjects: reg.subjects as string[],
  diplomas: reg.diplomas as string | undefined,
  experience: reg.experience as string | undefined,
  motivation: reg.motivation as string,
  status: reg.status as TeacherRegistration['status'],
  reviewedBy: reg.reviewed_by as string | undefined,
  reviewNotes: reg.review_notes as string | undefined,
  createdAt: new Date(reg.created_at as string),
  reviewedAt: reg.reviewed_at ? new Date(reg.reviewed_at as string) : undefined,
});

const mapWalletToType = (wallet: Record<string, unknown>): TeacherWallet => ({
  id: wallet.id as string,
  teacherId: wallet.teacher_id as string,
  balance: wallet.balance as number,
  totalEarned: wallet.total_earned as number,
  totalWithdrawn: wallet.total_withdrawn as number,
  createdAt: new Date(wallet.created_at as string),
  updatedAt: new Date(wallet.updated_at as string),
});
