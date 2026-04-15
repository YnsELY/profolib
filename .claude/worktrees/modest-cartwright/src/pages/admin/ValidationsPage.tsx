import React, { useEffect, useState } from 'react';
import {
  Check,
  X,
  User,
  BookOpen,
  Award,
  Briefcase,
  FileText,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Card, Button, Loader } from '../../components/ui';
import { TeacherRegistration } from '../../types';
import {
  getAllRegistrations,
  approveRegistration,
  rejectRegistration,
} from '../../services/admin';
import { useAuth } from '../../context/AuthContext';
import { formatDate, formatRelativeTime } from '../../utils/format';

const ValidationsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [registrations, setRegistrations] = useState<TeacherRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [selectedRegistration, setSelectedRegistration] = useState<TeacherRegistration | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [processing, setProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  useEffect(() => {
    loadRegistrations();
  }, []);

  const loadRegistrations = async () => {
    try {
      setLoading(true);
      const data = await getAllRegistrations();
      setRegistrations(data);
    } catch (err) {
      setError('Erreur lors du chargement des inscriptions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (registration: TeacherRegistration) => {
    if (!currentUser) return;
    
    try {
      setProcessing(true);
      await approveRegistration(registration.id, currentUser.id);
      await loadRegistrations();
      setSelectedRegistration(null);
    } catch (err) {
      setError('Erreur lors de l\'approbation');
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!currentUser || !selectedRegistration || !rejectionReason.trim()) return;
    
    try {
      setProcessing(true);
      await rejectRegistration(selectedRegistration.id, currentUser.id, rejectionReason);
      await loadRegistrations();
      setShowRejectionModal(false);
      setRejectionReason('');
      setSelectedRegistration(null);
    } catch (err) {
      setError('Erreur lors du rejet');
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const filteredRegistrations = registrations.filter((reg) => {
    const matchesFilter = filter === 'all' || reg.status === filter;
    const matchesSearch =
      reg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.subjects.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: TeacherRegistration['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3" />
            En attente
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" />
            Approuvé
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3" />
            Refusé
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader size="lg" text="Chargement des inscriptions..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Validations des inscriptions</h1>
          <p className="text-gray-500 mt-1">
            Examinez et approuvez les inscriptions des professeurs
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: registrations.length, color: 'bg-gray-100 text-gray-600' },
          { label: 'En attente', value: registrations.filter(r => r.status === 'pending').length, color: 'bg-yellow-100 text-yellow-600' },
          { label: 'Approuvés', value: registrations.filter(r => r.status === 'approved').length, color: 'bg-green-100 text-green-600' },
          { label: 'Refusés', value: registrations.filter(r => r.status === 'rejected').length, color: 'bg-red-100 text-red-600' },
        ].map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                <span className="font-bold">{stat.value}</span>
              </div>
              <span className="text-sm text-gray-600">{stat.label}</span>
            </div>
          </Card>
        ))}
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
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="approved">Approuvés</option>
              <option value="rejected">Refusés</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Registrations List */}
      <div className="space-y-4">
        {filteredRegistrations.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              Aucune inscription trouvée
            </h3>
            <p className="text-gray-500">
              {searchTerm
                ? 'Essayez de modifier vos critères de recherche'
                : 'Il n\'y a pas d\'inscription avec ce statut'}
            </p>
          </Card>
        ) : (
          filteredRegistrations.map((registration) => (
            <Card key={registration.id} className="overflow-hidden">
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {registration.name}
                      </h3>
                      {getStatusBadge(registration.status)}
                    </div>
                    <p className="text-gray-500 mb-4">{registration.email}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-start gap-2">
                        <BookOpen className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                          <span className="text-gray-500">Matières :</span>
                          <p className="text-gray-900">
                            {registration.subjects.join(', ')}
                          </p>
                        </div>
                      </div>

                      {registration.diplomas && (
                        <div className="flex items-start gap-2">
                          <Award className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div>
                            <span className="text-gray-500">Diplômes :</span>
                            <p className="text-gray-900">{registration.diplomas}</p>
                          </div>
                        </div>
                      )}

                      {registration.experience && (
                        <div className="flex items-start gap-2">
                          <Briefcase className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div>
                            <span className="text-gray-500">Expérience :</span>
                            <p className="text-gray-900">{registration.experience}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-2">
                        <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                          <span className="text-gray-500">Inscrit :</span>
                          <p className="text-gray-900">
                            {formatRelativeTime(registration.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Motivation */}
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                          <span className="text-gray-500 text-sm">Motivation :</span>
                          <p className="text-gray-900 mt-1">{registration.motivation}</p>
                        </div>
                      </div>
                    </div>

                    {/* Review info */}
                    {registration.reviewedAt && (
                      <div className="mt-4 text-sm text-gray-500">
                        Traité le {formatDate(registration.reviewedAt)}
                        {registration.reviewNotes && (
                          <p className="mt-1 italic">Note : {registration.reviewNotes}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {registration.status === 'pending' && (
                    <div className="flex lg:flex-col gap-2">
                      <Button
                        variant="primary"
                        className="flex items-center gap-2"
                        onClick={() => handleApprove(registration)}
                        isLoading={processing && selectedRegistration?.id === registration.id}
                        disabled={processing}
                      >
                        <Check className="w-4 h-4" />
                        Approuver
                      </Button>
                      <Button
                        variant="outline"
                        className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => {
                          setSelectedRegistration(registration);
                          setShowRejectionModal(true);
                        }}
                        disabled={processing}
                      >
                        <X className="w-4 h-4" />
                        Refuser
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Rejection Modal */}
      {showRejectionModal && selectedRegistration && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Refuser l'inscription
            </h3>
            <p className="text-gray-500 mb-4">
              Vous êtes sur le point de refuser l'inscription de{' '}
              <span className="font-medium text-gray-900">{selectedRegistration.name}</span>.
              Veuillez indiquer la raison du refus.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Raison du refus..."
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 mb-4 min-h-[100px]"
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowRejectionModal(false);
                  setRejectionReason('');
                }}
                disabled={processing}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={handleReject}
                isLoading={processing}
                disabled={!rejectionReason.trim()}
              >
                Confirmer le refus
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ValidationsPage;
