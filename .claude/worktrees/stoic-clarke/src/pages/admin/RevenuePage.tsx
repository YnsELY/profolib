import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  TrendingUp,
  Calendar,
  Download,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  PieChart,
  BarChart3,
} from 'lucide-react';
import { Card, Loader } from '../../components/ui';
import { PaymentWithDetails } from '../../types';
import { getAllPayments, getDashboardStats } from '../../services/admin';
import { formatCurrency, formatDate } from '../../utils/format';

const RevenuePage: React.FC = () => {
  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const [stats, setStats] = useState<{
    totalRevenue: number;
    totalTeacherRevenue: number;
    totalPlatformCommission: number;
    totalPayments: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending' | 'refunded'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [paymentsData, statsData] = await Promise.all([
        getAllPayments(),
        getDashboardStats(),
      ]);
      setPayments(paymentsData);
      setStats({
        totalRevenue: statsData.totalRevenue,
        totalTeacherRevenue: statsData.totalTeacherRevenue,
        totalPlatformCommission: statsData.totalPlatformCommission,
        totalPayments: statsData.totalPayments,
      });
    } catch (err) {
      setError('Erreur lors du chargement des données');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter((payment) => {
    if (filter === 'all') return true;
    return payment.status === filter;
  });

  const getStatusBadge = (status: PaymentWithDetails['status']) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" />
            Payé
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3" />
            En attente
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3" />
            Remboursé
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader size="lg" text="Chargement des revenus..." />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Erreur lors du chargement des données</p>
      </div>
    );
  }

  // Calculer les statistiques de période
  const paidPayments = payments.filter((p) => p.status === 'paid');
  const pendingPayments = payments.filter((p) => p.status === 'pending');
  const refundedPayments = payments.filter((p) => p.status === 'refunded');

  const paidAmount = paidPayments.reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
  const refundedAmount = refundedPayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Revenus</h1>
          <p className="text-gray-500 mt-1">
            Vue détaillée des paiements et de la répartition des revenus
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <Download className="w-4 h-4" />
          Exporter
        </button>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Chiffre d'affaires</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Total encaissé
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Revenus professeurs</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalTeacherRevenue)}</p>
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                À reverser
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Commission plateforme</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalPlatformCommission)}</p>
              <p className="text-xs text-purple-600 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Revenu net
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <PieChart className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Nombre de paiements</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPayments}</p>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <BarChart3 className="w-3 h-3" />
                Transactions
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Revenue Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Répartition par statut</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Payés</span>
                <span className="font-medium text-gray-900">{formatCurrency(paidAmount)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{
                    width: `${stats.totalRevenue > 0 ? (paidAmount / stats.totalRevenue) * 100 : 0}%`,
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{paidPayments.length} transactions</p>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">En attente</span>
                <span className="font-medium text-gray-900">{formatCurrency(pendingAmount)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{
                    width: `${stats.totalRevenue > 0 ? (pendingAmount / stats.totalRevenue) * 100 : 0}%`,
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{pendingPayments.length} transactions</p>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Remboursés</span>
                <span className="font-medium text-gray-900">{formatCurrency(refundedAmount)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{
                    width: `${stats.totalRevenue > 0 ? (refundedAmount / stats.totalRevenue) * 100 : 0}%`,
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{refundedPayments.length} transactions</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <h3 className="font-semibold text-gray-900 mb-4">Répartition des revenus</h3>
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <div className="flex items-center justify-center gap-8">
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-2 mx-auto">
                    <span className="text-lg font-bold text-green-700">
                      {stats.totalRevenue > 0
                        ? Math.round((stats.totalTeacherRevenue / stats.totalRevenue) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-700">Professeurs</p>
                  <p className="text-xs text-gray-500">{formatCurrency(stats.totalTeacherRevenue)}</p>
                </div>

                <div className="text-4xl text-gray-300">+</div>

                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-purple-100 flex items-center justify-center mb-2 mx-auto">
                    <span className="text-lg font-bold text-purple-700">
                      {stats.totalRevenue > 0
                        ? Math.round((stats.totalPlatformCommission / stats.totalRevenue) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-700">Plateforme</p>
                  <p className="text-xs text-gray-500">{formatCurrency(stats.totalPlatformCommission)}</p>
                </div>

                <div className="text-4xl text-gray-300">=</div>

                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mb-2 mx-auto">
                    <span className="text-lg font-bold text-blue-700">100%</span>
                  </div>
                  <p className="text-sm font-medium text-gray-700">Total</p>
                  <p className="text-xs text-gray-500">{formatCurrency(stats.totalRevenue)}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Payments List */}
      <Card>
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="font-semibold text-gray-900">Historique des paiements</h3>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as typeof filter)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="paid">Payés</option>
                <option value="pending">En attente</option>
                <option value="refunded">Remboursés</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Élève
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Professeur
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cours
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Aucun paiement trouvé</p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(payment.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{payment.studentName}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">
                        {payment.teacherName || '-'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{payment.subject}</p>
                      <p className="text-xs text-gray-500">{payment.durationMinutes} min</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(payment.amount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Comm. : {formatCurrency(payment.platformCommission)}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(payment.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default RevenuePage;
