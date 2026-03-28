import React, { useEffect, useState } from 'react';
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
  Clock,
  ArrowLeft,
  PartyPopper,
  Star,
} from 'lucide-react';
import { Layout } from '../../components/layout';
import { Button, Card } from '../../components/ui';
import { CourseRequest } from '../../types';
import { subscribeToRequest } from '../../services/requests';

const SessionPage: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<CourseRequest | null>(null);
  const [showCompletedModal, setShowCompletedModal] = useState(false);
  const [wasCompleted, setWasCompleted] = useState(false);

  useEffect(() => {
    if (!requestId) return;

    const unsubscribe = subscribeToRequest(requestId, (updatedRequest) => {
      // Check if status changed to completed
      if (updatedRequest?.status === 'completed' && !wasCompleted) {
        setWasCompleted(true);
        setShowCompletedModal(true);
      }
      setRequest(updatedRequest);
    });

    return () => unsubscribe();
  }, [requestId, wasCompleted]);

  const handleJoinMeeting = () => {
    if (request?.videoLink) {
      window.open(request.videoLink, '_blank');
    }
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
              className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-6 shadow-lg"
            >
              <CheckCircle className="w-10 h-10 text-white" />
            </motion.div>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Professeur trouve !
            </h1>
            <p className="text-lg text-gray-600">
              Rejoignez le cours en visio maintenant
            </p>
          </motion.div>

          {/* Main card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-8 shadow-soft-lg">
              {/* Teacher info */}
              <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-2xl p-6 mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                    {request.teacherName?.charAt(0).toUpperCase() || 'P'}
                  </div>
                  <div>
                    <p className="text-sm text-primary-600 font-medium">Votre professeur</p>
                    <p className="text-2xl font-bold text-gray-900">{request.teacherName}</p>
                    <div className="flex items-center gap-2 mt-1 text-gray-600">
                      <User className="w-4 h-4" />
                      <span className="text-sm">Professeur verifie</span>
                    </div>
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
                    <p className="text-sm text-gray-500">Votre demande</p>
                    <p className="font-medium text-gray-900">{request.description}</p>
                  </div>
                </div>
              </div>

              {/* Price paid */}
              <div className="bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200 rounded-2xl p-4 mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Prix du cours</p>
                    <p className="text-xs text-gray-500">
                      Duree: {formatDuration(request.durationMinutes)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary-600">
                      {request.studentPrice.toFixed(2)} €
                    </p>
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

              {/* Tips */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-8">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Conseils pour votre cours</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-700">
                      <li>Preparez vos questions a l'avance</li>
                      <li>Ayez votre exercice ou cours sous les yeux</li>
                      <li>Verifiez votre micro et camera avant de rejoindre</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate('/student/request')}
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Nouvelle demande
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

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
                Votre cours de {request.subject} avec {request.teacherName} est termine.
                Nous esperons qu'il vous a ete utile !
              </p>

              <div className="bg-gradient-to-br from-primary-50 to-blue-50 border border-primary-200 rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Star className="w-5 h-5 text-amber-500" />
                  <Star className="w-5 h-5 text-amber-500" />
                  <Star className="w-5 h-5 text-amber-500" />
                  <Star className="w-5 h-5 text-amber-500" />
                  <Star className="w-5 h-5 text-amber-500" />
                </div>
                <p className="text-sm text-gray-600">
                  N'hesitez pas a noter votre professeur pour aider les autres eleves.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCompletedModal(false)}
                >
                  Fermer
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600"
                  onClick={() => navigate('/student/request')}
                >
                  Nouveau cours
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
};

export default SessionPage;
