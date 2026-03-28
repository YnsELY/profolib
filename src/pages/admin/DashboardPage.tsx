import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserCheck,
  Wallet,
  CreditCard,
  TrendingUp,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { Card, Loader } from '../../components/ui';
import { AdminDashboardStats } from '../../types';
import { getDashboardStats } from '../../services/admin';
import { formatCurrency } from '../../utils/format';

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  trendUp?: boolean;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  to?: string;
}> = ({ title, value, icon: Icon, trend, trendUp, color, to }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
  };

  const content = (
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {trend && (
          <p className={`text-sm mt-1 flex items-center gap-1 ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className={`w-4 h-4 ${!trendUp && 'rotate-180'}`} />
            {trend}
          </p>
        )}
      </div>
      <div className={`p-3 rounded-xl ${colors[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to}>
        <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
          {content}
        </Card>
      </Link>
    );
  }

  return <Card className="h-full">{content}</Card>;
};

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      setError('Erreur lors du chargement des statistiques');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader size="lg" text="Chargement du dashboard..." />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error || 'Une erreur est survenue'}</p>
        <button
          onClick={loadStats}
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Vue d'ensemble de l'activité de la plateforme
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Utilisateurs total"
          value={stats.totalUsers}
          icon={Users}
          color="blue"
          to="/admin/accounts"
        />
        <StatCard
          title="Élèves"
          value={stats.totalStudents}
          icon={UserCheck}
          color="green"
          to="/admin/accounts"
        />
        <StatCard
          title="Professeurs"
          value={stats.totalTeachers}
          icon={Users}
          color="purple"
          to="/admin/accounts"
        />
        <StatCard
          title="Inscriptions en attente"
          value={stats.pendingRegistrations}
          icon={Clock}
          color="orange"
          to="/admin/validations"
        />
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Chiffre d'affaires total"
          value={formatCurrency(stats.totalRevenue)}
          icon={CreditCard}
          color="blue"
        />
        <StatCard
          title="Revenus professeurs"
          value={formatCurrency(stats.totalTeacherRevenue)}
          icon={Wallet}
          color="green"
        />
        <StatCard
          title="Commission plateforme"
          value={formatCurrency(stats.totalPlatformCommission)}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Recent Payments & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Paiements récents</h2>
            <Link
              to="/admin/revenue"
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              Voir tout
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="space-y-4">
            {stats.recentPayments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Aucun paiement récent</p>
            ) : (
              stats.recentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {payment.studentName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {payment.subject} • {payment.durationMinutes} min
                      {payment.teacherName && ` • ${payment.teacherName}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(payment.amount)}
                    </p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        payment.status === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : payment.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {payment.status === 'paid'
                        ? 'Payé'
                        : payment.status === 'pending'
                        ? 'En attente'
                        : 'Remboursé'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Actions rapides</h2>
          <div className="space-y-3">
            <Link
              to="/admin/validations"
              className="flex items-center justify-between p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Valider des inscriptions</p>
                  <p className="text-sm text-gray-500">
                    {stats.pendingRegistrations} professeur(s) en attente
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-primary-600" />
            </Link>

            <Link
              to="/admin/wallets"
              className="flex items-center justify-between p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Gérer les cagnottes</p>
                  <p className="text-sm text-gray-500">
                    Voir et payer les professeurs
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-green-600" />
            </Link>

            <Link
              to="/admin/revenue"
              className="flex items-center justify-between p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Voir les revenus</p>
                  <p className="text-sm text-gray-500">
                    {formatCurrency(stats.totalRevenue)} générés au total
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-purple-600" />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
