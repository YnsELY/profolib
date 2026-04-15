import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Send,
  Sparkles,
  UserCircle,
} from 'lucide-react';
import { Layout } from '../../components/layout';
import { Button, Card, Loader, Select } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { CourseRequest, LEVELS, SUBJECTS, PRICING_TIERS, getPricingByDuration } from '../../types';
import { createCourseRequest, getStudentRequests } from '../../services/requests';

type DashboardSection = 'request' | 'history' | 'stats' | 'account';
type StatsTimeframe = 'week' | 'month' | 'year';

const RequestPage: React.FC = () => {
  const [subject, setSubject] = useState('');
  const [level, setLevel] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('30'); // Duree par defaut: 30 min
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Prix actuel base sur la duree selectionnee
  const selectedPricing = getPricingByDuration(parseInt(duration, 10));
  const [activeSection, setActiveSection] = useState<DashboardSection>('request');
  const [history, setHistory] = useState<CourseRequest[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [timeframe, setTimeframe] = useState<StatsTimeframe>('month');
  const [timeOffset, setTimeOffset] = useState(0);

  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();

  const subjectOptions = [
    { value: '', label: 'Selectionnez une matiere' },
    ...SUBJECTS.map((s) => ({ value: s, label: s })),
  ];

  const levelOptions = [
    { value: '', label: 'Selectionnez votre niveau' },
    ...LEVELS.map((l) => ({ value: l, label: l })),
  ];

  useEffect(() => {
    if (!currentUser) return;
    let isActive = true;
    const timeoutId = window.setTimeout(() => {
      if (!isActive) return;
      console.warn('[RequestPage] history:timeout');
      setHistoryError('Chargement trop long. Veuillez reessayer.');
      setHistoryLoading(false);
    }, 8000);

    setHistoryLoading(true);
    setHistoryError('');
    getStudentRequests(currentUser.id)
      .then((data) => {
        if (!isActive) return;
        setHistoryError('');
        setHistory(data);
      })
      .catch((err) => {
        if (!isActive) return;
        console.error('[RequestPage] history:error', err);
        setHistoryError('Impossible de charger vos demandes.');
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

  const totals = useMemo(() => {
    const total = history.length;
    const pending = history.filter((req) => req.status === 'pending').length;
    const accepted = history.filter((req) => req.status === 'accepted').length;
    const completed = history.filter((req) => req.status === 'completed').length;
    return { total, pending, accepted, completed };
  }, [history]);

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
  const latestRequests = history.slice(0, 5);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedPricing) return;

    setError('');
    setLoading(true);
    console.info('[RequestPage] submit:start', {
      studentId: currentUser.id,
      subject,
      level,
      duration,
      price: selectedPricing.studentPrice,
      descriptionLength: description.length,
    });

    try {
      const requestId = await createCourseRequest({
        studentId: currentUser.id,
        studentName: currentUser.name,
        subject,
        level,
        description,
        durationMinutes: parseInt(duration, 10),
        studentPrice: selectedPricing.studentPrice,
        teacherRevenue: selectedPricing.teacherRevenue,
        platformCommission: selectedPricing.platformCommission,
      });

      console.info('[RequestPage] submit:success', { requestId });
      navigate(`/student/waiting/${requestId}`);
    } catch (err) {
      console.error('[RequestPage] submit:error', err);
      setError('Une erreur est survenue. Veuillez reessayer.');
    } finally {
      setLoading(false);
      console.info('[RequestPage] submit:done');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const menuItems = [
    {
      id: 'request' as DashboardSection,
      label: 'Demander un cours',
      icon: <Send className="w-5 h-5" />,
      description: 'Lancer une nouvelle demande',
    },
    {
      id: 'history' as DashboardSection,
      label: 'Mes cours',
      icon: <FileText className="w-5 h-5" />,
      description: 'Historique de vos demandes',
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
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-72 h-72 bg-primary-200/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-primary-300/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative w-full">
          <div className="flex flex-col lg:flex-row min-h-screen">
            {/* Sidebar */}
            <aside className="bg-white/80 backdrop-blur-lg border-r border-white/60 shadow-soft-lg p-6 w-full lg:w-72 lg:sticky lg:top-0 lg:h-screen">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white shadow-lg">
                  <LayoutDashboard className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tableau de bord</p>
                  <p className="text-lg font-semibold text-gray-900">Espace eleve</p>
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
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-lg font-semibold text-gray-900">{totals.total}</p>
                    <p className="text-xs text-gray-500">Demandes</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">{totals.pending}</p>
                    <p className="text-xs text-gray-500">En attente</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">{totals.completed}</p>
                    <p className="text-xs text-gray-500">Terminees</p>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 px-4 md:px-8 py-10 space-y-8">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/80 backdrop-blur-lg rounded-3xl border border-white/60 shadow-soft-lg p-6"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 bg-primary-100 px-4 py-2 rounded-full text-primary-700 text-sm font-medium mb-3">
                      <Sparkles className="w-4 h-4" />
                      Aide instantanee
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Votre espace eleve</h1>
                    <p className="text-sm md:text-base text-gray-600">
                      Suivez vos demandes, vos cours et vos statistiques.
                    </p>
                  </div>
                </div>
              </motion.div>

              {activeSection === 'request' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6"
                >
                  <Card className="p-8 shadow-soft-lg">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center">
                          <Send className="w-6 h-6" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900">Demander un cours</h2>
                          <p className="text-sm text-gray-500">
                            Decrivez votre besoin, un professeur arrive rapidement.
                          </p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-gray-700 font-medium">
                            <BookOpen className="w-5 h-5 text-primary-500" />
                            <span>Matiere</span>
                          </div>
                          <Select
                            options={subjectOptions}
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-gray-700 font-medium">
                            <GraduationCap className="w-5 h-5 text-primary-500" />
                            <span>Niveau</span>
                          </div>
                          <Select
                            options={levelOptions}
                            value={level}
                            onChange={(e) => setLevel(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      {/* Selection de la duree */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-700 font-medium">
                          <Clock className="w-5 h-5 text-primary-500" />
                          <span>Duree du cours</span>
                        </div>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                          {PRICING_TIERS.map((tier) => {
                            const isSelected = duration === tier.durationMinutes.toString();
                            const label = tier.durationMinutes >= 60
                              ? `${tier.durationMinutes / 60}h`
                              : `${tier.durationMinutes} min`;
                            return (
                              <button
                                key={tier.durationMinutes}
                                type="button"
                                onClick={() => setDuration(tier.durationMinutes.toString())}
                                className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                                  isSelected
                                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                }`}
                              >
                                <p className="text-sm font-semibold">{label}</p>
                                <p className={`text-xs ${isSelected ? 'text-primary-600' : 'text-gray-500'}`}>
                                  {tier.studentPrice.toFixed(2)} €
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-700 font-medium">
                          <MessageSquare className="w-5 h-5 text-primary-500" />
                          <span>Decrivez votre besoin</span>
                        </div>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Ex: Je ne comprends pas les equations du second degre, j'ai besoin d'aide pour un exercice..."
                          required
                          rows={4}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent hover:border-gray-300 resize-none"
                        />
                      </div>

                      {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                          {error}
                        </div>
                      )}

                      {/* Recapitulatif du prix */}
                      {selectedPricing && (
                        <div className="p-4 bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200 rounded-2xl">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">Prix du cours</p>
                              <p className="text-xs text-gray-500">
                                Duree: {parseInt(duration, 10) >= 60 ? `${parseInt(duration, 10) / 60}h` : `${duration} min`}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-primary-600">
                                {selectedPricing.studentPrice.toFixed(2)} €
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                        isLoading={loading}
                      >
                        <Send className="w-5 h-5 mr-2" />
                        Trouver un professeur - {selectedPricing?.studentPrice.toFixed(2)} €
                      </Button>

                      <p className="text-center text-sm text-gray-500">
                        Votre demande sera envoyee a tous les professeurs disponibles.
                      </p>
                    </form>
                  </Card>

                  <div className="space-y-6">
                    <Card className="p-6 border border-gray-100">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Dernieres demandes</p>
                          <p className="text-sm text-gray-500">Vos 5 dernieres demandes</p>
                        </div>
                      </div>
                      {historyLoading ? (
                        <div className="py-6 flex justify-center">
                          <Loader text="Chargement..." size="sm" />
                        </div>
                      ) : latestRequests.length > 0 ? (
                        <div className="max-h-72 overflow-y-auto pr-2 space-y-4">
                          {latestRequests.map((request) => (
                            <div
                              key={request.id}
                              className="p-4 rounded-2xl border border-gray-100 bg-gray-50"
                            >
                              <p className="text-sm text-gray-500">{request.level}</p>
                              <p className="font-semibold text-gray-900">{request.subject}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(request.createdAt).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Aucune demande pour le moment.</p>
                      )}
                    </Card>

                    <Card className="p-6 border border-gray-100">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Conseils rapides</p>
                          <p className="text-sm text-gray-500">Pour obtenir un prof vite</p>
                        </div>
                      </div>
                      <ul className="space-y-3 text-sm text-gray-600">
                        <li>- Precisez clairement votre difficulte.</li>
                        <li>- Indiquez l'exercice ou le cours concerne.</li>
                        <li>- Restez sur la page en attendant la reponse.</li>
                      </ul>
                    </Card>
                  </div>
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
                        <p className="text-sm text-gray-500">Suivez toutes vos demandes passees.</p>
                      </div>
                    </div>

                    {historyLoading ? (
                      <div className="py-10 flex justify-center">
                        <Loader text="Chargement des demandes..." />
                      </div>
                    ) : historyError ? (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                        {historyError}
                      </div>
                    ) : history.length === 0 ? (
                      <p className="text-sm text-gray-500">Vous n'avez encore aucune demande.</p>
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
                                {request.teacherName && <span>Prof: {request.teacherName}</span>}
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
                            <p className="text-sm text-gray-600">Demandes sur la periode</p>
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
                                  <div key={segment.subject} className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                                    <span
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: segment.color }}
                                    ></span>
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-gray-900">{segment.subject}</p>
                                      <p className="text-xs text-gray-500">
                                        {segment.count} demande{segment.count > 1 ? 's' : ''} (
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
                        <p className="text-base font-semibold text-gray-900">
                          {currentUser?.role === 'teacher' ? 'Professeur' : 'Eleve'}
                        </p>
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
                      <Button
                        className="flex-1 bg-gray-900 hover:bg-gray-950"
                        onClick={handleSignOut}
                      >
                        Se deconnecter
                      </Button>
                    </div>
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

export default RequestPage;
