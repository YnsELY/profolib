import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Users,
  Mail,
  Lock,
  User,
  ArrowRight,
  Check,
  AlertCircle,
  Zap,
  Award,
  Briefcase,
  FileText,
  CheckCircle,
  Clock,
  Shield,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Card } from '../components/ui';
import { SUBJECTS, UserRole } from '../types';
import { submitTeacherRegistration } from '../services/admin';
import logo from '../assets/profolib-logo-small.png';

type AuthMode = 'login' | 'register';
type RegistrationStep = 'account' | 'profile' | 'submitted';

const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [role, setRole] = useState<UserRole | null>(null);
  const [step, setStep] = useState<RegistrationStep>('account');
  
  // Account info
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // Teacher profile
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [diplomas, setDiplomas] = useState('');
  const [experience, setExperience] = useState('');
  const [motivation, setMotivation] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn, signUp, demoLogin, demoEnabled } = useAuth();
  const navigate = useNavigate();

  // Connexion rapide demo
  const handleDemoLogin = (demoRole: 'student' | 'teacher' | 'admin') => {
    demoLogin(demoRole);
    switch (demoRole) {
      case 'admin':
        navigate('/admin');
        break;
      case 'teacher':
        navigate('/teacher/dashboard');
        break;
      default:
        navigate('/student/request');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (mode === 'register') {
      if (!role) {
        setError('Veuillez selectionner votre role');
        return;
      }

      // Pour les professeurs, on passe à l'étape 2
      if (role === 'teacher' && step === 'account') {
        setStep('profile');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        await signIn(email, password);
        // La redirection sera gérée par AuthRedirect
        setTimeout(() => {
          window.location.href = '/';
        }, 100);
      } else {
        // Inscription
        if (!role) {
          setError('Veuillez selectionner votre role');
          setLoading(false);
          return;
        }
        
        if (role === 'teacher') {
          // Pour les professeurs : créer la demande d'inscription
          await submitTeacherRegistration({
            email,
            name,
            subjects: selectedSubjects,
            diplomas,
            experience,
            motivation,
          });
          setStep('submitted');
        } else {
          // Pour les élèves : inscription directe
          await signUp(email, password, name, role, selectedSubjects);
          navigate('/student/request');
        }
      }
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string };
      if (firebaseError.code === 'auth/email-already-in-use') {
        setError('Cet email est deja utilise');
      } else if (firebaseError.code === 'auth/weak-password') {
        setError('Le mot de passe doit contenir au moins 6 caracteres');
      } else if (firebaseError.code === 'auth/invalid-email') {
        setError('Email invalide');
      } else if (firebaseError.code === 'auth/user-not-found' || firebaseError.code === 'auth/wrong-password') {
        setError('Email ou mot de passe incorrect');
      } else {
        setError(firebaseError.message || 'Une erreur est survenue. Veuillez reessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject]
    );
  };

  const resetForm = () => {
    setMode('login');
    setStep('account');
    setRole(null);
    setEmail('');
    setPassword('');
    setName('');
    setSelectedSubjects([]);
    setDiplomas('');
    setExperience('');
    setMotivation('');
    setError('');
  };

  const roleCards = [
    {
      role: 'student' as UserRole,
      icon: <BookOpen className="w-8 h-8" />,
      title: 'Je suis eleve',
      description: 'Je cherche un professeur pour m\'aider',
    },
    {
      role: 'teacher' as UserRole,
      icon: <Users className="w-8 h-8" />,
      title: 'Je suis professeur',
      description: 'Je veux aider des eleves',
    },
  ];

  // Écran de confirmation après soumission professeur
  if (step === 'submitted') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="relative w-full max-w-lg">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="p-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Inscription en cours de validation
              </h2>
              <p className="text-gray-600 mb-6">
                Merci pour votre inscription ! Votre candidature a été soumise à notre équipe.
                Elle sera examinée dans les plus brefs délais. Vous recevrez un email de confirmation
                une fois votre compte approuvé.
              </p>
              <div className="bg-blue-50 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-left text-sm text-blue-700">
                    <p className="font-medium mb-1">Prochaines étapes :</p>
                    <ul className="space-y-1">
                      <li>• Validation de votre candidature par un administrateur</li>
                      <li>• Réception d'un email de confirmation</li>
                      <li>• Activation de votre compte professeur</li>
                    </ul>
                  </div>
                </div>
              </div>
              <Button onClick={resetForm} className="w-full">
                Retour à la connexion
              </Button>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-start sm:items-center justify-center p-4 pt-6 sm:pt-4">
      <div className="relative w-full max-w-lg mt-8 sm:mt-0">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-0 sm:mb-1"
        >
          <a href="/" className="inline-block">
            <img
              src={logo}
              alt="Profolib"
              className="h-32 w-auto mx-auto object-contain transition-all duration-300 hover:scale-105"
            />
          </a>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-8 shadow-soft-lg">
            {demoEnabled && (
              <>
                {/* Demo Quick Login */}
                <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl">
                  <div className="flex items-center gap-2 text-amber-700 mb-3">
                    <Zap className="w-5 h-5" />
                    <span className="font-semibold text-sm">Mode Demo - Connexion rapide</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => handleDemoLogin('student')}
                      className="flex flex-col items-center justify-center gap-1 py-3 px-2 bg-white border-2 border-primary-200 rounded-xl text-primary-700 font-medium hover:bg-primary-50 hover:border-primary-400 transition-all duration-200"
                    >
                      <BookOpen className="w-5 h-5" />
                      <span className="text-xs">Élève</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDemoLogin('teacher')}
                      className="flex flex-col items-center justify-center gap-1 py-3 px-2 bg-white border-2 border-green-200 rounded-xl text-green-700 font-medium hover:bg-green-50 hover:border-green-400 transition-all duration-200"
                    >
                      <Users className="w-5 h-5" />
                      <span className="text-xs">Prof</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDemoLogin('admin')}
                      className="flex flex-col items-center justify-center gap-1 py-3 px-2 bg-white border-2 border-purple-200 rounded-xl text-purple-700 font-medium hover:bg-purple-50 hover:border-purple-400 transition-all duration-200"
                    >
                      <Shield className="w-5 h-5" />
                      <span className="text-xs">Admin</span>
                    </button>
                  </div>
                </div>

                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">ou</span>
                  </div>
                </div>
              </>
            )}

            {/* Mode Toggle */}
            <div className="flex bg-gray-100 rounded-xl p-1 mb-8">
              {(['login', 'register'] as AuthMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMode(m);
                    setError('');
                    setRole(null);
                    setStep('account');
                  }}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                    mode === m
                      ? 'bg-white text-primary-600 shadow-md'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {m === 'login' ? 'Connexion' : 'Inscription'}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.form
                key={`${mode}-${step}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {mode === 'register' && step === 'account' && (
                  <>
                    {/* Role Selection */}
                    <div className="space-y-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Vous etes...
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        {roleCards.map((card) => (
                          <motion.button
                            key={card.role}
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setRole(card.role)}
                            className={`relative p-5 rounded-2xl border-2 text-left transition-all duration-300 ${
                              role === card.role
                                ? 'border-primary-500 bg-primary-50 shadow-glow'
                                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                            }`}
                          >
                            {role === card.role && (
                              <div className="absolute top-3 right-3 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            )}
                            <div
                              className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3 ${
                                role === card.role
                                  ? 'bg-primary-500 text-white'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {card.icon}
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-1">{card.title}</h3>
                            <p className="text-sm text-gray-500">{card.description}</p>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Info bulle pour les professeurs */}
                    {role === 'teacher' && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-2 p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-700"
                      >
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium">Validation requise</p>
                          <p className="mt-1">
                            Les inscriptions professeurs sont soumises à validation par notre équipe.
                            Vous devrez fournir des informations sur votre parcours et votre motivation.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </>
                )}

                {mode === 'register' && step === 'profile' && role === 'teacher' && (
                  <>
                    {/* Step indicator */}
                    <div className="flex items-center gap-2 mb-6">
                      <div className="flex-1 h-2 bg-primary-200 rounded-full"></div>
                      <div className="flex-1 h-2 bg-primary-500 rounded-full"></div>
                      <span className="text-sm text-gray-500">Étape 2/2</span>
                    </div>

                    <h3 className="font-semibold text-gray-900 mb-4">
                      Complétez votre profil
                    </h3>

                    {/* Subjects */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Matières enseignées *
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {SUBJECTS.map((subject) => (
                          <button
                            key={subject}
                            type="button"
                            onClick={() => toggleSubject(subject)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                              selectedSubjects.includes(subject)
                                ? 'bg-primary-500 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {subject}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Diplomas */}
                    <div className="relative">
                      <Award className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Diplômes et certifications"
                        value={diplomas}
                        onChange={(e) => setDiplomas(e.target.value)}
                        className="pl-12"
                      />
                    </div>

                    {/* Experience */}
                    <div className="relative">
                      <Briefcase className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
                      <textarea
                        placeholder="Votre expérience professionnelle"
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        rows={3}
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                      />
                    </div>

                    {/* Motivation */}
                    <div className="relative">
                      <FileText className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
                      <textarea
                        placeholder="Votre motivation pour rejoindre EduConnect *"
                        value={motivation}
                        onChange={(e) => setMotivation(e.target.value)}
                        rows={3}
                        required
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setStep('account')}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      ← Retour à l'étape précédente
                    </button>
                  </>
                )}

                {/* Account fields - shown for login OR first step of registration */}
                {(mode === 'login' || step === 'account') && (
                  <>
                    {/* Name (Register only) */}
                    {mode === 'register' && (
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          type="text"
                          placeholder="Votre prenom"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          className="pl-12"
                        />
                      </div>
                    )}

                    {/* Email */}
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="email"
                        placeholder="Votre email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-12"
                      />
                    </div>

                    {/* Password */}
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="password"
                        placeholder="Votre mot de passe"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="pl-12"
                      />
                    </div>
                  </>
                )}

                {/* Error message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700"
                  >
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </motion.div>
                )}

                {/* Submit button */}
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  isLoading={loading}
                >
                  {mode === 'login' 
                    ? 'Se connecter' 
                    : step === 'account' 
                      ? role === 'teacher' 
                        ? 'Continuer' 
                        : 'Creer mon compte'
                      : 'Soumettre ma candidature'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>

                {/* Switch mode link */}
                <p className="text-center text-gray-600">
                  {mode === 'login' ? (
                    <>
                      Pas encore de compte ?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setMode('register');
                          setError('');
                          setStep('account');
                        }}
                        className="text-primary-600 font-semibold hover:text-primary-700 transition-colors"
                      >
                        S'inscrire
                      </button>
                    </>
                  ) : (
                    <>
                      Deja inscrit ?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setMode('login');
                          setError('');
                          setStep('account');
                        }}
                        className="text-primary-600 font-semibold hover:text-primary-700 transition-colors"
                      >
                        Se connecter
                      </button>
                    </>
                  )}
                </p>
              </motion.form>
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* Back to home */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-8"
        >
          <span className="text-gray-400 font-medium">
            Profolib - Votre plateforme de cours en visio
          </span>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
