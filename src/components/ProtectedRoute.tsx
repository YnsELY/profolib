import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { Loader } from './ui';
import { Clock, LogOut } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const TeacherPendingPage: React.FC = () => {
  const { signOut } = useAuth();
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-lg p-8 text-center">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="w-10 h-10 text-amber-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Compte en attente de validation
        </h2>
        <p className="text-gray-600 mb-6">
          Votre candidature est en cours d'examen par notre equipe. Vous recevrez un email
          des que votre compte sera active. Cela prend generalement quelques heures.
        </p>
        <div className="bg-blue-50 rounded-2xl p-4 mb-6 text-left text-sm text-blue-700">
          <p className="font-medium mb-2">Prochaines etapes :</p>
          <ul className="space-y-1">
            <li>• Verification de votre candidature par un administrateur</li>
            <li>• Activation de votre compte professeur</li>
            <li>• Acces a votre tableau de bord</li>
          </ul>
        </div>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-2 mx-auto text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Se deconnecter
        </button>
      </div>
    </div>
  );
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader size="lg" text="Chargement..." />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Professeur non encore approuve par l'admin
  if (currentUser.role === 'teacher' && !currentUser.approved) {
    return <TeacherPendingPage />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    let redirectPath: string;
    switch (currentUser.role) {
      case 'admin':
        redirectPath = '/admin';
        break;
      case 'teacher':
        redirectPath = '/teacher/dashboard';
        break;
      case 'student':
      default:
        redirectPath = '/student/request';
        break;
    }
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
