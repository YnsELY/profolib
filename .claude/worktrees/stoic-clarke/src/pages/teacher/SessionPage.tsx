import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video,
  User,
  BookOpen,
  GraduationCap,
  CheckCircle,
  ExternalLink,
  MessageSquare,
  ArrowLeft,
  Clock,
  Play,
  Timer,
  Wallet,
  X,
  PartyPopper,
} from 'lucide-react';
import { Layout } from '../../components/layout';
import { Button, Card } from '../../components/ui';
import { CourseRequest } from '../../types';
import { subscribeToRequest, completeRequest } from '../../services/requests';

type CourseStatus = 'not_started' | 'in_progress' | 'ended';

const TeacherSessionPage: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<CourseRequest | null>(null);
  const [courseStatus, setCourseStatus] = useState<CourseStatus>('not_started');
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCompletedModal, setShowCompletedModal] = useState(false);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (!requestId) return;

    const unsubscribe = subscribeToRequest(requestId, (updatedRequest) => {
      setRequest(updatedRequest);
      // If course is already completed, show the completed modal
      if (updatedRequest?.status === 'completed') {
        setShowCompletedModal(true);
      }
    });

    return () => unsubscribe();
  }, [requestId]);

  // Countdown timer
  useEffect(() => {
    if (courseStatus !== 'in_progress') return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          setCourseStatus('ended');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [courseStatus]);

  const handleStartCourse = useCallback(() => {
    if (!request) return;
    setCourseStatus('in_progress');
    setRemainingSeconds(request.durationMinutes * 60);
  }, [request]);

  const handleComplete = async () => {
    if (!requestId || completing) return;
    setCompleting(true);
    try {
      await completeRequest(requestId);
      setShowConfirmModal(false);
      setShowCompletedModal(true);
    } catch (error) {
      console.error('Error completing course:', error);
      setCompleting(false);
    }
  };

  const handleJoinMeeting = () => {
    if (request?.videoLink) {
      window.open(request.videoLink, '_blank');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h${mins}` : `${hours}h`;
    }
    return `${minutes} min`;
  };

  if (!request) {
    return (
      <Layout showFooter={false} showNavbar={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showFooter={false} showNavbar={false}>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-primary-50 pt-24 pb-12 px-4">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-72 h-72 bg-green-200/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-primary-200/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-2xl mx-auto">
          {/* Success header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 shadow-lg ${
                courseStatus === 'in_progress'
                  ? 'bg-primary-500'
                  : courseStatus === 'ended'
                  ? 'bg-amber-500'
                  : 'bg-green-500'
              }`}
            >
              {courseStatus === 'in_progress' ? (
                <Timer className="w-10 h-10 text-white" />
              ) : courseStatus === 'ended' ? (
                <CheckCircle className="w-10 h-10 text-white" />
              ) : (
                <CheckCircle className="w-10 h-10 text-white" />
              )}
            </motion.div>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {courseStatus === 'in_progress'
                ? 'Cours en cours'
                : courseStatus === 'ended'
                ? 'Temps ecoule !'
                : 'Cours accepte !'}
            </h1>
            <p className="text-lg text-gray-600">
              {courseStatus === 'in_progress'
                ? 'Le chronometre est lance. Bon cours !'
                : courseStatus === 'ended'
                ? 'Vous pouvez maintenant terminer le cours.'
                : "L'eleve vous attend. Demarrez le cours quand vous etes pret."}
            </p>
          </motion.div>

          {/* Timer display */}
          {courseStatus === 'in_progress' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8"
            >
              <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl p-8 text-white text-center shadow-xl">
                <p className="text-primary-100 text-sm mb-2">Temps restant</p>
                <p className="text-6xl font-bold font-mono tracking-wider">
                  {formatTime(remainingSeconds)}
                </p>
                <p className="text-primary-200 text-sm mt-2">
                  sur {formatDuration(request.durationMinutes)}
                </p>
              </div>
            </motion.div>
          )}

          {/* Course ended timer */}
          {courseStatus === 'ended' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8"
            >
              <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-3xl p-8 text-white text-center shadow-xl">
                <p className="text-amber-100 text-sm mb-2">Cours termine</p>
                <p className="text-4xl font-bold">
                  {formatDuration(request.durationMinutes)} ecoules
                </p>
                <p className="text-amber-200 text-sm mt-4">
                  Cliquez sur "Terminer le cours" pour confirmer et recevoir votre paiement.
                </p>
              </div>
            </motion.div>
          )}

          {/* Main card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-8 shadow-soft-lg">
              {/* Student info */}
              <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-2xl p-6 mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                    {request.studentName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-primary-600 font-medium">Votre eleve</p>
                    <p className="text-2xl font-bold text-gray-900">{request.studentName}</p>
                    <div className="flex items-center gap-2 mt-1 text-gray-600">
                      <User className="w-4 h-4" />
                      <span className="text-sm">{request.level}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Votre revenu</p>
                    <p className="text-2xl font-bold text-green-600">
                      {request.teacherRevenue.toFixed(2)} €
                    </p>
                  </div>
                </div>
              </div>

              {/* Request details */}
              <div className="grid md:grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Matiere</p>
                      <p className="font-semibold text-gray-900">{request.subject}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Niveau</p>
                      <p className="font-semibold text-gray-900">{request.level}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                      <Clock className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Duree</p>
                      <p className="font-semibold text-gray-900">{formatDuration(request.durationMinutes)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Besoin de l'eleve</p>
                    <p className="font-medium text-gray-900">{request.description}</p>
                  </div>
                </div>
              </div>

              {/* Video link */}
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 mb-8 text-white">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Video className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-green-100 text-sm">Lien de la visioconference</p>
                    <p className="font-medium break-all">{request.videoLink}</p>
                  </div>
                </div>
                <Button
                  onClick={handleJoinMeeting}
                  className="w-full bg-white text-green-600 hover:bg-green-50"
                  size="lg"
                >
                  <Video className="w-5 h-5 mr-2" />
                  Rejoindre le cours
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </div>

              {/* Start button - only when not started */}
              {courseStatus === 'not_started' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8"
                >
                  <Button
                    onClick={handleStartCourse}
                    className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 py-6 text-lg"
                    size="lg"
                  >
                    <Play className="w-6 h-6 mr-3" />
                    Demarrer le cours ({formatDuration(request.durationMinutes)})
                  </Button>
                  <p className="text-center text-sm text-gray-500 mt-3">
                    Le chronometre demarrera des que vous cliquez.
                  </p>
                </motion.div>
              )}

              {/* Tips for teachers - only when not started */}
              {courseStatus === 'not_started' && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-8">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Conseils pour le cours</p>
                      <ul className="list-disc list-inside space-y-1 text-blue-700">
                        <li>Commencez par demander a l'eleve de vous expliquer son probleme</li>
                        <li>Utilisez le partage d'ecran pour montrer des exemples</li>
                        <li>Verifiez la comprehension regulierement</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate('/teacher/dashboard')}
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Retour au dashboard
                </Button>
                {(courseStatus === 'ended' || courseStatus === 'in_progress') && (
                  <Button
                    className={`flex-1 ${
                      courseStatus === 'ended'
                        ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                        : 'bg-gray-800 hover:bg-gray-900'
                    }`}
                    onClick={() => setShowConfirmModal(true)}
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Terminer le cours
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => !completing && setShowConfirmModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-green-600" />
                </div>
                <button
                  onClick={() => !completing && setShowConfirmModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  disabled={completing}
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Terminer le cours ?
              </h3>
              <p className="text-gray-600 mb-6">
                Confirmez que le cours avec {request.studentName} est termine.
                Votre cagnotte sera creditee de {request.teacherRevenue.toFixed(2)} €.
              </p>

              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6">
                <div className="flex items-center gap-3">
                  <Wallet className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-green-700">Credit a recevoir</p>
                    <p className="text-2xl font-bold text-green-600">
                      +{request.teacherRevenue.toFixed(2)} €
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={completing}
                >
                  Annuler
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600"
                  onClick={handleComplete}
                  isLoading={completing}
                >
                  Confirmer
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completed Modal */}
      <AnimatePresence>
        {showCompletedModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
              >
                <PartyPopper className="w-10 h-10 text-white" />
              </motion.div>

              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Cours termine !
              </h3>
              <p className="text-gray-600 mb-6">
                Felicitations ! Votre cours avec {request.studentName} a ete complete avec succes.
              </p>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <Wallet className="w-6 h-6 text-green-600" />
                  <p className="text-sm text-green-700 font-medium">Cagnotte creditee</p>
                </div>
                <p className="text-4xl font-bold text-green-600">
                  +{request.teacherRevenue.toFixed(2)} €
                </p>
              </div>

              <Button
                className="w-full bg-gradient-to-r from-primary-500 to-primary-600"
                onClick={() => navigate('/teacher/dashboard')}
              >
                Retour au dashboard
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
};

export default TeacherSessionPage;
