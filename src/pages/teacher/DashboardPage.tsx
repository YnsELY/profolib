import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Bell,
  BookOpen,
  CheckCircle,
  Clock,
  Coffee,
  FileText,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  UserCircle,
  Wallet,
  Zap,
} from 'lucide-react';
import { Layout } from '../../components/layout';
import { Button, Card, Loader } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { CourseRequest, TeacherWallet, WalletTransaction } from '../../types';
import { subscribeToPendingRequests, acceptRequest, getTeacherRequests } from '../../services/requests';
import { getTeacherWallet, getWalletTransactions } from '../../services/wallet';

type DashboardSection = 'requests' | 'history' | 'stats' | 'account';
type StatsTimeframe = 'week' | 'month' | 'year';

const DashboardPage: React.FC = () => {
  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<CourseRequest[]>([]);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const prevRequestCount = useRef(0);

  const [activeSection, setActiveSection] = useState<DashboardSection>('requests');
  const [history, setHistory] = useState<CourseRequest[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [timeframe, setTimeframe] = useState<StatsTimeframe>('month');
  const [timeOffset, setTimeOffset] = useState(0);
  const [wallet, setWallet] = useState<TeacherWallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [walletLoading, setWalletLoading] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToPendingRequests(
      currentUser.subjects || [],
      (newRequests) => {
        if (newRequests.length > prevRequestCount.current && isOnline) {
          playNotificationSound();
        }
        prevRequestCount.current = newRequests.length;
        setRequests(newRequests);
      }
    );

    return () => unsubscribe();
  }, [currentUser, isOnline]);

  useEffect(() => {
    if (!currentUser) return;
    let isActive = true;
    const timeoutId = window.setTimeout(() => {
      if (!isActive) return;
      console.warn('[TeacherDashboard] history:timeout');
      setHistoryError('Chargement trop long. Veuillez reessayer.');
      setHistoryLoading(false);
    }, 8000);

    setHistoryLoading(true);
    setHistoryError('');
    getTeacherRequests(currentUser.id)
      .then((data) => {
        if (!isActive) return;
        setHistoryError('');
        setHistory(data);
      })
      .catch((err) => {
        if (!isActive) return;
        console.error('[TeacherDashboard] history:error', err);
        setHistoryError('Impossible de charger vos cours.');
      })
      .finally(() => {
        if (!isActive) return;
        window.clearTimeout(timeoutId);
        setHistoryLoading(false);
      });

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
    };
  }, [currentUser]);

  // Fetch wallet data
  useEffect(() => {
    if (!currentUser) return;
    let isActive = true;

    setWalletLoading(true);
    getTeacherWallet(currentUser.id)
      .then((walletData) => {
        if (!isActive) return;
        setWallet(walletData);
        if (walletData) {
          getWalletTransactions(walletData.id, 20).then((txData) => {
            if (isActive) {
              setTransactions(txData);
            }
          });
        }
      })
      .catch((err) => {
        if (!isActive) return;
        console.error('[TeacherDashboard] wallet:error', err);
      })
      .finally(() => {
        if (!isActive) return;
        setWalletLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [currentUser]);

  const playNotificationSound = () => {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioContext = new AudioContextClass();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;

      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch {
      // Audio not supported or blocked
    }
  };

  const handleAccept = async (request: CourseRequest) => {
    if (!currentUser || acceptingId) return;

    setAcceptingId(request.id);
    try {
      await acceptRequest(request.id, currentUser.id, currentUser.name);
      navigate(`/teacher/session/${request.id}`);
    } catch (error) {
      console.error('Error accepting request:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      
      if (errorMessage.includes('already accepted') || errorMessage.includes('déjà acceptée')) {
        alert('Cette demande a deja ete acceptee par un autre professeur.');
      } else if (errorMessage.includes('permission') || errorMessage.includes('RLS') || errorMessage.includes('policy')) {
        alert('Erreur de permission. Veuillez verifier que vous etes connecte.');
      } else {
        alert(`Erreur: ${errorMessage}`);
      }
      
      setAcceptingId(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'A l\'instant';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Il y a ${minutes} min`;
    return `Il y a ${Math.floor(minutes / 60)}h`;
  };

  const totals = useMemo(() => {
    const total = history.length;
    const accepted = history.filter((req) => req.status === 'accepted').length;
    const completed = history.filter((req) => req.status === 'completed').length;
    const cancelled = history.filter((req) => req.status === 'cancelled').length;
    return { total, pending: requests.length, accepted, completed, cancelled };
  }, [history, requests.length]);

  const historyTimeline = useMemo(() => {
    const monthLabels = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayLabels = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const now = new Date();

    const getDateKey = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const getMonthKey = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      return `${year}-${month}`;
    };

    const entries: { key: string; label: string; count: number }[] = [];
    let rangeLabel = '';

    if (timeframe === 'year') {
      const endMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      endMonth.setMonth(endMonth.getMonth() - timeOffset * 12);
      const startMonth = new Date(endMonth);
      startMonth.setMonth(endMonth.getMonth() - 11);

      const monthMap = new Map<string, { key: string; label: string; count: number }>();
      for (let i = 0; i < 12; i += 1) {
        const date = new Date(startMonth.getFullYear(), startMonth.getMonth() + i, 1);
        const key = getMonthKey(date);
        const label = `${monthLabels[date.getMonth()]} ${String(date.getFullYear()).slice(-2)}`;
        const entry = { key, label, count: 0 };
        monthMap.set(key, entry);
        entries.push(entry);
      }

      history.forEach((request) => {
        const date = new Date(request.createdAt);
        const key = getMonthKey(date);
        const entry = monthMap.get(key);
        if (entry) {
          entry.count += 1;
        }
      });

      const startLabel = `${monthLabels[startMonth.getMonth()]} ${startMonth.getFullYear()}`;
      const endLabel = `${monthLabels[endMonth.getMonth()]} ${endMonth.getFullYear()}`;
      rangeLabel = `${startLabel} - ${endLabel}`;
    } else {
      const windowDays = timeframe === 'week' ? 7 : 30;
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() - timeOffset * windowDays);
      const startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - (windowDays - 1));

      const dayMap = new Map<string, { key: string; label: string; count: number }>();
      for (let i = 0; i < windowDays; i += 1) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const key = getDateKey(date);
        const label =
          timeframe === 'week'
            ? dayLabels[date.getDay()]
            : date.getDate() === 1
              ? `${date.getDate()} ${monthLabels[date.getMonth()]}`
              : i % 5 === 0 || i === windowDays - 1
                ? String(date.getDate())
                : '';
        const entry = { key, label, count: 0 };
        dayMap.set(key, entry);
        entries.push(entry);
      }

      history.forEach((request) => {
        const date = new Date(request.createdAt);
        const key = getDateKey(date);
        const entry = dayMap.get(key);
        if (entry) {
          entry.count += 1;
        }
      });

      const startLabel = `${String(startDate.getDate()).padStart(2, '0')} ${monthLabels[startDate.getMonth()]}`;
      const endLabel = `${String(endDate.getDate()).padStart(2, '0')} ${monthLabels[endDate.getMonth()]}`;
      rangeLabel = `Du ${startLabel} au ${endLabel}`;
    }

    return { entries, rangeLabel };
  }, [history, timeframe, timeOffset]);

  const maxTimelineCount = historyTimeline.entries.reduce((max, entry) => Math.max(max, entry.count), 1);
  const timelineTicks = useMemo(() => {
    const steps = 4;
    const maxValue = Math.max(maxTimelineCount, 1);
    return Array.from({ length: steps + 1 }, (_item, index) => {
      const value = Math.round((maxValue / steps) * (steps - index));
      return value;
    });
  }, [maxTimelineCount]);

  const subjectStats = useMemo(() => {
    const counts = new Map<string, number>();
    history.forEach((request) => {
      counts.set(request.subject, (counts.get(request.subject) || 0) + 1);
    });
    const entries = Array.from(counts.entries()).map(([subject, count]) => ({ subject, count }));
    entries.sort((a, b) => b.count - a.count);
    return entries;
  }, [history]);

  const subjectTotal = subjectStats.reduce((total, entry) => total + entry.count, 0);
  const pieSegments = useMemo(() => {
    if (subjectTotal === 0) return [];
    const colors = ['#2563eb', '#10b981', '#f97316', '#a855f7', '#eab308', '#14b8a6', '#ef4444'];
    let cursor = 0;
    return subjectStats.map((entry, index) => {
      const value = (entry.count / subjectTotal) * 100;
      const segment = {
        ...entry,
        color: colors[index % colors.length],
        start: cursor,
        end: cursor + value,
      };
      cursor += value;
      return segment;
    });
  }, [subjectStats, subjectTotal]);

  const menuItems = [
    {
      id: 'requests' as DashboardSection,
      label: 'Demandes',
      icon: <Bell className="w-5 h-5" />,
      description: 'Cours en attente',
    },
    {
      id: 'history' as DashboardSection,
      label: 'Mes cours',
      icon: <FileText className="w-5 h-5" />,
      description: 'Historique des cours',
    },
    {
      id: 'stats' as DashboardSection,
      label: 'Statistiques',
      icon: <BarChart3 className="w-5 h-5" />,
      description: 'Repartitions et tendances',
    },
    {
      id: 'account' as DashboardSection,
      label: 'Mon compte',
      icon: <UserCircle className="w-5 h-5" />,
      description: 'Profil et securite',
    },
  ];

  return (
    <Layout showFooter={false} showNavbar={false}>
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-72 h-72 bg-primary-200/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-primary-300/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative w-full">
          <div className="flex flex-col lg:flex-row min-h-screen">
            <aside className="bg-white/80 backdrop-blur-lg border-r border-white/60 shadow-soft-lg p-6 w-full lg:w-72 lg:sticky lg:top-0 lg:h-screen">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white shadow-lg">
                  <LayoutDashboard className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tableau de bord</p>
                  <p className="text-lg font-semibold text-gray-900">Espace professeur</p>
                </div>
              </div>

              <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
                {menuItems.map((item) => {
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveSection(item.id)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-left min-w-[200px] lg:min-w-0 transition-all duration-200 ${
                        isActive
                          ? 'bg-primary-500 text-white shadow-lg'
                          : 'bg-white/80 text-gray-600 hover:bg-primary-50 hover:text-primary-700'
                      }`}
                    >
                      <span className={`${isActive ? 'text-white' : 'text-primary-500'}`}>{item.icon}</span>
                      <div>
                        <p className="text-sm font-semibold">{item.label}</p>
                        <p className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                          {item.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {currentUser?.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Bonjour,</p>
                    <p className="font-semibold text-gray-900">{currentUser?.name}</p>
                  </div>
                </div>

                {/* Wallet balance */}
                <div className="mt-4 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/60">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="w-4 h-4 text-green-600" />
                    <p className="text-xs text-gray-600">Cagnotte</p>
                  </div>
                  {walletLoading ? (
                    <p className="text-sm text-gray-500">Chargement...</p>
                  ) : wallet ? (
                    <p className="text-2xl font-bold text-green-600">
                      {wallet.balance.toFixed(2)} €
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500">Non disponible</p>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-lg font-semibold text-gray-900">{totals.pending}</p>
                    <p className="text-xs text-gray-500">En attente</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">{totals.completed}</p>
                    <p className="text-xs text-gray-500">Termines</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">{totals.total}</p>
                    <p className="text-xs text-gray-500">Cours</p>
                  </div>
                </div>
              </div>
            </aside>

            <div className="flex-1 px-4 md:px-8 py-10 space-y-8">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/80 backdrop-blur-lg rounded-3xl border border-white/60 shadow-soft-lg p-6"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 bg-primary-100 px-4 py-2 rounded-full text-primary-700 text-sm font-medium mb-3">
                      <Zap className="w-4 h-4" />
                      Disponibilite
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Votre espace professeur</h1>
                    <p className="text-sm md:text-base text-gray-600">
                      Suivez vos demandes et vos cours en direct.
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setIsOnline(!isOnline)}
                      className={`relative inline-flex h-12 w-24 items-center rounded-full transition-colors ${
                        isOnline ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-flex h-10 w-10 transform items-center justify-center rounded-full bg-white shadow-lg transition-transform ${
                          isOnline ? 'translate-x-12' : 'translate-x-1'
                        }`}
                      >
                        {isOnline ? (
                          <Zap className="w-5 h-5 text-green-500" />
                        ) : (
                          <Coffee className="w-5 h-5 text-gray-400" />
                        )}
                      </span>
                    </button>
                    <span className={`font-medium ${isOnline ? 'text-green-600' : 'text-gray-500'}`}>
                      {isOnline ? 'En ligne' : 'En pause'}
                    </span>
                  </div>
                </div>
              </motion.div>

              {activeSection === 'requests' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <Card className="p-6 shadow-soft-lg">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">Demandes en attente</h2>
                        <p className="text-sm text-gray-500">Acceptez une demande pour demarrer un cours.</p>
                      </div>
                      {currentUser?.subjects && currentUser.subjects.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {currentUser.subjects.map((subject) => (
                            <span
                              key={subject}
                              className="px-3 py-1.5 bg-primary-100 text-primary-700 rounded-full text-xs font-medium"
                            >
                              {subject}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <AnimatePresence mode="popLayout">
                      {requests.length === 0 ? (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                        >
                          <div className="p-12 text-center">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                              <Bell className="w-10 h-10 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                              Aucune demande en attente
                            </h3>
                            <p className="text-gray-600 max-w-md mx-auto">
                              {isOnline
                                ? 'Les nouvelles demandes d\'eleves apparaitront ici automatiquement.'
                                : 'Vous etes en pause. Passez en ligne pour recevoir des demandes.'}
                            </p>
                          </div>
                        </motion.div>
                      ) : (
                        <div className="space-y-4">
                          {requests.map((request, index) => (
                            <motion.div
                              key={request.id}
                              initial={{ opacity: 0, y: 20, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, x: -100, scale: 0.95 }}
                              transition={{ delay: index * 0.05 }}
                              layout
                            >
                              <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-soft">
                                <div className="flex flex-col md:flex-row md:items-center gap-6">
                                  <div className="flex items-center gap-4 flex-shrink-0">
                                    <div className="relative">
                                      <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                                        {request.studentName.charAt(0).toUpperCase()}
                                      </div>
                                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse"></span>
                                    </div>
                                    <div>
                                      <p className="font-semibold text-gray-900">{request.studentName}</p>
                                      <div className="flex items-center gap-1 text-sm text-gray-500">
                                        <Clock className="w-4 h-4" />
                                        {formatTimeAgo(request.createdAt)}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-4">
                                    <div className="flex items-center gap-2">
                                      <BookOpen className="w-5 h-5 text-primary-500" />
                                      <div>
                                        <p className="text-xs text-gray-500">Matiere</p>
                                        <p className="font-medium text-gray-900">{request.subject}</p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <GraduationCap className="w-5 h-5 text-primary-500" />
                                      <div>
                                        <p className="text-xs text-gray-500">Niveau</p>
                                        <p className="font-medium text-gray-900">{request.level}</p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <Clock className="w-5 h-5 text-primary-500" />
                                      <div>
                                        <p className="text-xs text-gray-500">Duree</p>
                                        <p className="font-medium text-gray-900">
                                          {request.durationMinutes >= 60
                                            ? `${request.durationMinutes / 60}h`
                                            : `${request.durationMinutes} min`}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-start gap-2 sm:col-span-1">
                                      <MessageSquare className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                                      <div>
                                        <p className="text-xs text-gray-500">Besoin</p>
                                        <p className="font-medium text-gray-900 line-clamp-2">{request.description}</p>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex-shrink-0 flex flex-col items-end gap-2">
                                    <div className="text-right mb-2">
                                      <p className="text-xs text-gray-500">Votre revenu</p>
                                      <p className="text-xl font-bold text-green-600">
                                        {request.teacherRevenue.toFixed(2)} €
                                      </p>
                                    </div>
                                    <Button
                                      onClick={() => handleAccept(request)}
                                      isLoading={acceptingId === request.id}
                                      disabled={!!acceptingId}
                                      className="w-full md:w-auto bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                                    >
                                      <CheckCircle className="w-5 h-5 mr-2" />
                                      Accepter
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </AnimatePresence>
                  </Card>

                  {requests.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-center"
                    >
                      <p className="text-sm text-gray-500">
                        Le premier professeur a accepter obtient le cours. Soyez rapide !
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {activeSection === 'history' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <Card className="p-6 shadow-soft-lg">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">Historique des cours</h2>
                        <p className="text-sm text-gray-500">Suivez vos cours acceptes et termines.</p>
                      </div>
                    </div>

                    {historyLoading ? (
                      <div className="py-10 flex justify-center">
                        <Loader text="Chargement des cours..." />
                      </div>
                    ) : historyError ? (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                        {historyError}
                      </div>
                    ) : history.length === 0 ? (
                      <p className="text-sm text-gray-500">Vous n'avez encore aucun cours.</p>
                    ) : (
                      <div className="space-y-4">
                        {history.map((request) => {
                          const statusStyles = {
                            pending: 'bg-amber-50 text-amber-700 border-amber-200',
                            accepted: 'bg-blue-50 text-blue-700 border-blue-200',
                            completed: 'bg-green-50 text-green-700 border-green-200',
                            cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
                          }[request.status];

                          return (
                            <div
                              key={request.id}
                              className="p-5 rounded-2xl border border-gray-100 bg-gray-50"
                            >
                              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                <div>
                                  <p className="text-sm text-gray-500">{request.level}</p>
                                  <p className="text-lg font-semibold text-gray-900">{request.subject}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusStyles}`}>
                                  {request.status}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-3">{request.description}</p>
                              <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-500">
                                <span>
                                  Demande: {new Date(request.createdAt).toLocaleDateString('fr-FR', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </span>
                                <span>Eleve: {request.studentName}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Card>
                </motion.div>
              )}

              {activeSection === 'stats' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <Card className="p-6 shadow-soft-lg">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center">
                        <BarChart3 className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">Statistiques</h2>
                        <p className="text-sm text-gray-500">Suivez l'historique de vos cours.</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-4 gap-4 mb-8">
                      {[
                        { label: 'Total', value: totals.total },
                        { label: 'En attente', value: totals.pending },
                        { label: 'Acceptees', value: totals.accepted },
                        { label: 'Terminees', value: totals.completed },
                      ].map((item) => (
                        <div key={item.label} className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                          <p className="text-sm text-gray-500">{item.label}</p>
                          <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
                        </div>
                      ))}
                    </div>

                    {totals.total === 0 ? (
                      <p className="text-sm text-gray-500">Aucune donnee disponible pour le moment.</p>
                    ) : (
                      <div className="space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Cours sur la periode</p>
                            <p className="text-xs text-gray-500">{historyTimeline.rangeLabel}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {(['week', 'month', 'year'] as StatsTimeframe[]).map((range) => {
                              const isActive = timeframe === range;
                              const labels = { week: 'Semaine', month: 'Mois', year: 'Annee' };
                              return (
                                <button
                                  key={range}
                                  type="button"
                                  onClick={() => {
                                    setTimeframe(range);
                                    setTimeOffset(0);
                                  }}
                                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                                    isActive
                                      ? 'bg-primary-500 text-white shadow-soft'
                                      : 'bg-gray-100 text-gray-600 hover:bg-primary-100 hover:text-primary-700'
                                  }`}
                                >
                                  {labels[range]}
                                </button>
                              );
                            })}
                            <div className="flex items-center gap-2 ml-2">
                              <button
                                type="button"
                                onClick={() => setTimeOffset((prev) => prev + 1)}
                                className="px-2.5 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200"
                              >
                                Prec
                              </button>
                              <button
                                type="button"
                                onClick={() => setTimeOffset((prev) => Math.max(prev - 1, 0))}
                                disabled={timeOffset === 0}
                                className={`px-2.5 py-1.5 rounded-full text-xs font-semibold ${
                                  timeOffset === 0
                                    ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                Suiv
                              </button>
                            </div>
                            <span className="text-xs text-gray-500 ml-1">Total: {totals.total}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-[48px_1fr] gap-4 items-end">
                          <div className="flex flex-col justify-between h-48 text-xs text-gray-400">
                            {timelineTicks.map((tick, index) => (
                              <span key={`${tick}-${index}`}>{tick}</span>
                            ))}
                          </div>
                          <div className="relative h-48">
                            <div className="absolute inset-0 flex flex-col justify-between">
                              {timelineTicks.map((tick, index) => (
                                <div key={`${tick}-line-${index}`} className="border-t border-gray-100"></div>
                              ))}
                            </div>
                            <div className="relative h-full flex items-stretch gap-4">
                              {historyTimeline.entries.map((entry) => (
                                <div key={entry.key} className="flex-1 flex flex-col items-center gap-2">
                                  <div className="w-full flex-1 flex items-end">
                                    <div
                                      className="w-full rounded-t-2xl bg-gradient-to-t from-primary-600 to-primary-400 transition-all shadow-soft"
                                      style={{ height: `${(entry.count / maxTimelineCount) * 100}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-xs text-gray-500 min-h-[16px]">{entry.label}</span>
                                  <span className="text-xs font-semibold text-gray-700">{entry.count}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="grid lg:grid-cols-[280px_1fr] gap-6 pt-4 border-t border-gray-100">
                          <div className="flex flex-col items-center gap-4">
                            <div
                              className="w-52 h-52 rounded-full shadow-soft-lg"
                              style={{
                                background:
                                  pieSegments.length === 0
                                    ? '#f3f4f6'
                                    : `conic-gradient(${pieSegments
                                        .map((segment) => `${segment.color} ${segment.start}% ${segment.end}%`)
                                        .join(', ')})`,
                              }}
                            ></div>
                            <p className="text-xs text-gray-500">Repartition des matieres</p>
                          </div>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-gray-900">Matieres les plus demandees</p>
                              <span className="text-xs text-gray-500">Total: {subjectTotal}</span>
                            </div>
                            {pieSegments.length === 0 ? (
                              <p className="text-sm text-gray-500">Aucune donnee disponible pour le moment.</p>
                            ) : (
                              <div className="grid md:grid-cols-2 gap-3">
                                {pieSegments.map((segment) => (
                                  <div
                                    key={segment.subject}
                                    className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100"
                                  >
                                    <span
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: segment.color }}
                                    ></span>
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-gray-900">{segment.subject}</p>
                                      <p className="text-xs text-gray-500">
                                        {segment.count} cours{segment.count > 1 ? 's' : ''} (
                                        {Math.round((segment.count / subjectTotal) * 100)}%)
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                </motion.div>
              )}

              {activeSection === 'account' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <Card className="p-6 shadow-soft-lg">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center">
                        <UserCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">Mon compte</h2>
                        <p className="text-sm text-gray-500">Gerez vos informations personnelles.</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                        <p className="text-xs text-gray-500">Nom</p>
                        <p className="text-base font-semibold text-gray-900">{currentUser?.name}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="text-base font-semibold text-gray-900">{currentUser?.email}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                        <p className="text-xs text-gray-500">Role</p>
                        <p className="text-base font-semibold text-gray-900">Professeur</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                        <p className="text-xs text-gray-500">Matieres</p>
                        <p className="text-base font-semibold text-gray-900">
                          {currentUser?.subjects && currentUser.subjects.length > 0
                            ? currentUser.subjects.join(', ')
                            : 'Non renseigne'}
                        </p>
                      </div>
                      <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                        <p className="text-xs text-gray-500">Compte cree</p>
                        <p className="text-base font-semibold text-gray-900">
                          {currentUser?.createdAt
                            ? new Date(currentUser.createdAt).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '-'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                      <Button variant="outline" className="flex-1">
                        Modifier mon profil
                      </Button>
                      <Button className="flex-1 bg-gray-900 hover:bg-gray-950" onClick={handleSignOut}>
                        Se deconnecter
                      </Button>
                    </div>
                  </Card>

                  {/* Wallet Section */}
                  <Card className="p-6 shadow-soft-lg">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center">
                        <Wallet className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">Ma cagnotte</h2>
                        <p className="text-sm text-gray-500">Suivez vos gains et retraits.</p>
                      </div>
                    </div>

                    {walletLoading ? (
                      <div className="py-10 flex justify-center">
                        <Loader text="Chargement de la cagnotte..." />
                      </div>
                    ) : wallet ? (
                      <div className="space-y-6">
                        {/* Wallet summary */}
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="p-4 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
                            <p className="text-xs text-green-700 mb-1">Solde disponible</p>
                            <p className="text-3xl font-bold text-green-600">
                              {wallet.balance.toFixed(2)} €
                            </p>
                          </div>
                          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                            <p className="text-xs text-gray-500 mb-1">Total gagne</p>
                            <p className="text-2xl font-semibold text-gray-900">
                              {wallet.totalEarned.toFixed(2)} €
                            </p>
                          </div>
                          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                            <p className="text-xs text-gray-500 mb-1">Total retire</p>
                            <p className="text-2xl font-semibold text-gray-900">
                              {wallet.totalWithdrawn.toFixed(2)} €
                            </p>
                          </div>
                        </div>

                        {/* Transactions history */}
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Dernieres transactions</h3>
                            {wallet.balance >= 10 && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 border-green-300 hover:bg-green-50"
                              >
                                Demander un retrait
                              </Button>
                            )}
                          </div>

                          {transactions.length === 0 ? (
                            <p className="text-sm text-gray-500 py-4">Aucune transaction pour le moment.</p>
                          ) : (
                            <div className="space-y-3">
                              {transactions.map((transaction) => {
                                const isPositive = transaction.amount > 0;
                                const statusStyles = {
                                  pending: 'bg-amber-50 text-amber-700',
                                  completed: 'bg-green-50 text-green-700',
                                  failed: 'bg-red-50 text-red-700',
                                  cancelled: 'bg-gray-100 text-gray-600',
                                }[transaction.status];

                                const typeIcons = {
                                  earning: '💰',
                                  withdrawal: '🏦',
                                  refund: '🔄',
                                  bonus: '🎁',
                                };

                                return (
                                  <div
                                    key={transaction.id}
                                    className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100"
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="text-2xl">{typeIcons[transaction.type]}</span>
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">
                                          {transaction.description ||
                                            (transaction.type === 'earning' ? 'Gain de cours' :
                                             transaction.type === 'withdrawal' ? 'Retrait' :
                                             transaction.type === 'bonus' ? 'Bonus' : 'Remboursement')}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                          <p className="text-xs text-gray-500">
                                            {new Date(transaction.createdAt).toLocaleDateString('fr-FR', {
                                              day: '2-digit',
                                              month: 'short',
                                              year: 'numeric',
                                            })}
                                          </p>
                                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles}`}>
                                            {transaction.status}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <p className={`text-lg font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                      {isPositive ? '+' : ''}{transaction.amount.toFixed(2)} €
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {wallet.balance >= 10 && (
                          <div className="p-4 bg-green-50 border border-green-200 rounded-2xl">
                            <p className="text-sm text-green-700">
                              💡 Vous pouvez demander un retrait a partir de 10 €. Les retraits sont traites sous 2-5 jours ouvrables.
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <p className="text-sm text-gray-500">Impossible de charger votre cagnotte.</p>
                      </div>
                    )}
                  </Card>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;
