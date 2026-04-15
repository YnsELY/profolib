import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Clock,
  BookOpen,
  GraduationCap,
  MessageSquare,
  X,
  Loader2,
} from 'lucide-react';
import { Layout } from '../../components/layout';
import { Button, Card } from '../../components/ui';
import { CourseRequest } from '../../types';
import { subscribeToRequest, cancelRequest } from '../../services/requests';

const WaitingPage: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<CourseRequest | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Subscribe to request updates
  useEffect(() => {
    if (!requestId) return;

    const unsubscribe = subscribeToRequest(requestId, (updatedRequest) => {
      setRequest(updatedRequest);

      // Redirect when a teacher accepts
      if (updatedRequest && updatedRequest.status === 'accepted') {
        navigate(`/student/session/${requestId}`);
      }
    });

    return () => unsubscribe();
  }, [requestId, navigate]);

  const handleCancel = async () => {
    if (!requestId) return;
    await cancelRequest(requestId);
    navigate('/student/request');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Layout showFooter={false} showNavbar={false}>
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center pt-20 pb-12 px-4">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-72 h-72 bg-primary-200/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-primary-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative max-w-lg w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="p-8 text-center shadow-soft-lg">
              {/* Animated loader */}
              <div className="relative w-32 h-32 mx-auto mb-8">
                {/* Outer ring */}
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-primary-200"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                />

                {/* Inner spinning ring */}
                <motion.div
                  className="absolute inset-2 rounded-full border-4 border-transparent border-t-primary-500"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                />

                {/* Pulsing center */}
                <div className="absolute inset-6 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center animate-pulse">
                  <Loader2 className="w-10 h-10 text-white animate-spin" />
                </div>

                {/* Glow effect */}
                <div className="absolute inset-4 rounded-full bg-primary-400 blur-xl opacity-30 animate-pulse"></div>
              </div>

              {/* Status text */}
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Recherche d'un professeur...
              </h2>
              <p className="text-gray-600 mb-6">
                Votre demande a ete envoyee. Un professeur va accepter sous peu.
              </p>

              {/* Timer */}
              <div className="inline-flex items-center gap-2 bg-primary-50 px-4 py-2 rounded-full text-primary-700 font-medium mb-8">
                <Clock className="w-5 h-5" />
                Temps d'attente : {formatTime(elapsedTime)}
              </div>

              {/* Request summary */}
              {request && (
                <div className="bg-gray-50 rounded-2xl p-6 text-left space-y-4 mb-8">
                  <h3 className="font-semibold text-gray-900 mb-4">Recapitulatif de votre demande</h3>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Matiere</p>
                      <p className="font-medium text-gray-900">{request.subject}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Niveau</p>
                      <p className="font-medium text-gray-900">{request.level}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Description</p>
                      <p className="font-medium text-gray-900">{request.description}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Cancel button */}
              <Button
                variant="outline"
                onClick={handleCancel}
                className="text-gray-600 hover:text-red-600 hover:border-red-300"
              >
                <X className="w-5 h-5 mr-2" />
                Annuler la demande
              </Button>
            </Card>
          </motion.div>

          {/* Tips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-center"
          >
            <p className="text-sm text-gray-500">
              Temps moyen d'attente : 2-5 minutes
            </p>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default WaitingPage;
