// Types pour les utilisateurs
export type UserRole = 'student' | 'teacher' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  subjects?: string[]; // Pour les professeurs
  approved?: boolean; // Pour les professeurs en attente
  createdAt: Date;
}

// Types pour l'administration
export interface TeacherRegistration {
  id: string;
  email: string;
  name: string;
  subjects: string[];
  diplomas?: string;
  experience?: string;
  motivation: string;
  status: RegistrationStatus;
  reviewedBy?: string;
  reviewNotes?: string;
  createdAt: Date;
  reviewedAt?: Date;
}

export type RegistrationStatus = 'pending' | 'approved' | 'rejected';

export interface TeacherWalletWithInfo extends TeacherWallet {
  teacherName: string;
  teacherEmail: string;
}

export interface PaymentWithDetails extends Payment {
  studentName: string;
  teacherName?: string;
  subject: string;
  durationMinutes: number;
}

export interface AdminDashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  pendingRegistrations: number;
  totalRevenue: number;
  totalTeacherRevenue: number;
  totalPlatformCommission: number;
  totalPayments: number;
  recentPayments: PaymentWithDetails[];
}

// Types pour les demandes de cours
export type RequestStatus = 'pending' | 'accepted' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';

export interface CourseRequest {
  id: string;
  studentId: string;
  studentName: string;
  subject: string;
  level: string;
  description: string;
  status: RequestStatus;
  teacherId?: string;
  teacherName?: string;
  videoLink?: string;
  createdAt: Date;
  acceptedAt?: Date;
  // Tarification
  durationMinutes: number;
  studentPrice: number;
  teacherRevenue: number;
  platformCommission: number;
  paymentStatus: PaymentStatus;
}

// Grille tarifaire
export interface PricingTier {
  id: string;
  durationMinutes: number;
  studentPrice: number;
  teacherRevenue: number;
  platformCommission: number;
  isActive: boolean;
}

// Grille tarifaire en dur (pour le mode demo)
export const PRICING_TIERS: Omit<PricingTier, 'id' | 'isActive'>[] = [
  { durationMinutes: 10, studentPrice: 3.00, teacherRevenue: 2.00, platformCommission: 1.00 },
  { durationMinutes: 20, studentPrice: 5.00, teacherRevenue: 3.50, platformCommission: 1.50 },
  { durationMinutes: 30, studentPrice: 7.50, teacherRevenue: 5.50, platformCommission: 2.00 },
  { durationMinutes: 45, studentPrice: 11.00, teacherRevenue: 8.50, platformCommission: 2.50 },
  { durationMinutes: 60, studentPrice: 14.00, teacherRevenue: 11.00, platformCommission: 3.00 },
  { durationMinutes: 120, studentPrice: 26.00, teacherRevenue: 21.00, platformCommission: 5.00 },
];

// Durees disponibles pour le select
export const DURATION_OPTIONS = PRICING_TIERS.map(tier => ({
  value: tier.durationMinutes.toString(),
  label: tier.durationMinutes >= 60
    ? `${tier.durationMinutes / 60}h`
    : `${tier.durationMinutes} min`,
  price: tier.studentPrice,
}));

// Fonction utilitaire pour obtenir le tarif par duree
export const getPricingByDuration = (durationMinutes: number): Omit<PricingTier, 'id' | 'isActive'> | undefined => {
  return PRICING_TIERS.find(tier => tier.durationMinutes === durationMinutes);
};

// Cagnotte du professeur
export interface TeacherWallet {
  id: string;
  teacherId: string;
  balance: number;
  totalEarned: number;
  totalWithdrawn: number;
  createdAt: Date;
  updatedAt: Date;
}

// Paiement
export interface Payment {
  id: string;
  courseRequestId: string;
  studentId: string;
  amount: number;
  platformCommission: number;
  teacherRevenue: number;
  paymentMethod?: string;
  paymentIntentId?: string;
  status: PaymentStatus;
  paidAt?: Date;
  refundedAt?: Date;
  createdAt: Date;
}

// Transaction de cagnotte
export type TransactionType = 'earning' | 'withdrawal' | 'refund' | 'bonus';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface WalletTransaction {
  id: string;
  walletId: string;
  courseRequestId?: string;
  type: TransactionType;
  amount: number; // Montant de la transaction (positif pour gain, négatif pour retrait)
  studentPrice?: number; // Prix payé par l'élève (pour les gains)
  teacherRevenue?: number; // Revenu du professeur (pour les gains)
  platformCommission?: number; // Commission de la plateforme
  description?: string;
  status: TransactionStatus;
  createdAt: Date;
  processedAt?: Date;
}

// Liste des matières disponibles
export const SUBJECTS = [
  'Mathematiques',
  'Physique-Chimie',
  'Francais',
  'Anglais',
  'Espagnol',
  'Allemand',
  'Histoire-Geographie',
  'SVT',
  'Philosophie',
  'SES',
  'Informatique',
  'Autre',
] as const;

export type Subject = typeof SUBJECTS[number];

// Niveaux scolaires
export const LEVELS = [
  '6eme',
  '5eme',
  '4eme',
  '3eme',
  'Seconde',
  'Premiere',
  'Terminale',
  'Licence 1',
  'Licence 2',
  'Licence 3',
  'Master',
  'Autre',
] as const;

export type Level = typeof LEVELS[number];

// Props pour les composants
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}
