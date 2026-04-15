import React, { useEffect, useState } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  User,
  CreditCard,
  DollarSign,
  History,
} from 'lucide-react';
import { Card, Button, Loader } from '../../components/ui';
import { TeacherWalletWithInfo } from '../../types';
import { getAllWallets, processWithdrawal } from '../../services/admin';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/format';

const WalletsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [wallets, setWallets] = useState<TeacherWalletWithInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWallet, setSelectedWallet] = useState<TeacherWalletWithInfo | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadWallets();
  }, []);

  const loadWallets = async () => {
    try {
      setLoading(true);
      const data = await getAllWallets();
      setWallets(data);
    } catch (err) {
      setError('Erreur lors du chargement des cagnottes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!currentUser || !selectedWallet || !withdrawAmount) return;

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0 || amount > selectedWallet.balance) {
      return;
    }

    try {
      setProcessing(true);
      await processWithdrawal(
        selectedWallet.id,
        amount,
        currentUser.id,
        `Paiement manuel à ${selectedWallet.teacherName}`
      );
      await loadWallets();
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      setSelectedWallet(null);
    } catch (err) {
      setError('Erreur lors du traitement du paiement');
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const filteredWallets = wallets.filter(
    (wallet) =>
      wallet.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wallet.teacherEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);
  const totalEarned = wallets.reduce((sum, w) => sum + w.totalEarned, 0);
  const totalWithdrawn = wallets.reduce((sum, w) => sum + w.totalWithdrawn, 0);

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader size="lg" text="Chargement des cagnottes..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cagnottes des professeurs</h1>
        <p className="text-gray-500 mt-1">
          Gérez les cagnottes et effectuez les paiements aux professeurs
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Solde total disponible</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalBalance)}</p>
              <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                <ArrowUpRight className="w-4 h-4" />
                À payer aux professeurs
              </p>
            </div>
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
              <Wallet className="w-7 h-7 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total gagné</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalEarned)}</p>
              <p className="text-sm text-blue-600 mt-1 flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                Cumul depuis le début
              </p>
            </div>
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
              <CreditCard className="w-7 h-7 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total payé</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalWithdrawn)}</p>
              <p className="text-sm text-purple-600 mt-1 flex items-center gap-1">
                <ArrowDownRight className="w-4 h-4" />
                Versés aux professeurs
              </p>
            </div>
            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
              <History className="w-7 h-7 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un professeur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </Card>

      {/* Wallets List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredWallets.length === 0 ? (
          <Card className="col-span-full p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              Aucune cagnotte trouvée
            </h3>
            <p className="text-gray-500">
              {searchTerm
                ? 'Essayez de modifier vos critères de recherche'
                : 'Il n\'y a pas encore de cagnottes créées'}
            </p>
          </Card>
        ) : (
          filteredWallets.map((wallet) => (
            <Card key={wallet.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-primary-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{wallet.teacherName}</h3>
                    <p className="text-sm text-gray-500">{wallet.teacherEmail}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(wallet.balance)}
                  </p>
                  <p className="text-sm text-gray-500">disponible</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 py-4 border-y border-gray-100">
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(wallet.totalEarned)}
                  </p>
                  <p className="text-xs text-gray-500">Total gagné</p>
                </div>
                <div className="text-center border-x border-gray-100">
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(wallet.totalWithdrawn)}
                  </p>
                  <p className="text-xs text-gray-500">Total payé</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(wallet.balance)}
                  </p>
                  <p className="text-xs text-gray-500">À payer</p>
                </div>
              </div>

              <div className="mt-4">
                <Button
                  variant="primary"
                  className="w-full"
                  disabled={wallet.balance <= 0}
                  onClick={() => {
                    setSelectedWallet(wallet);
                    setShowWithdrawModal(true);
                  }}
                >
                  Effectuer un paiement
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Withdraw Modal */}
      {showWithdrawModal && selectedWallet && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Effectuer un paiement
            </h3>
            <p className="text-gray-500 mb-4">
              Vous allez payer{' '}
              <span className="font-medium text-gray-900">{selectedWallet.teacherName}</span>
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Solde disponible :</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(selectedWallet.balance)}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Montant à payer
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={selectedWallet.balance}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Maximum : {formatCurrency(selectedWallet.balance)}
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowWithdrawModal(false);
                  setWithdrawAmount('');
                }}
                disabled={processing}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleWithdraw}
                isLoading={processing}
                disabled={
                  !withdrawAmount ||
                  parseFloat(withdrawAmount) <= 0 ||
                  parseFloat(withdrawAmount) > selectedWallet.balance
                }
              >
                Confirmer le paiement
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default WalletsPage;
