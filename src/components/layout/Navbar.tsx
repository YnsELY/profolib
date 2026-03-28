import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, GraduationCap, LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!currentUser) return '/auth';
    return currentUser.role === 'teacher' ? '/teacher/dashboard' : '/student/request';
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/80 backdrop-blur-lg shadow-soft'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary-400 rounded-xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
              <div className="relative bg-gradient-to-br from-primary-600 to-primary-500 p-2.5 rounded-xl shadow-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
            </div>
            <span className="text-xl font-bold text-gray-900">
              Edu<span className="text-primary-600">Connect</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/#how-it-works"
              className="text-gray-600 hover:text-primary-600 font-medium transition-colors duration-200"
            >
              Comment ca marche
            </Link>
            <Link
              to="/#benefits"
              className="text-gray-600 hover:text-primary-600 font-medium transition-colors duration-200"
            >
              Avantages
            </Link>

            {currentUser ? (
              <div className="flex items-center gap-4">
                <Link
                  to={getDashboardLink()}
                  className="flex items-center gap-2 text-gray-700 hover:text-primary-600 font-medium transition-colors"
                >
                  <User className="w-5 h-5" />
                  {currentUser.name}
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-gray-500 hover:text-red-500"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => navigate('/auth')}
                size="sm"
              >
                Se connecter
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-xl text-gray-600 hover:text-primary-600 hover:bg-gray-100 transition-all"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg rounded-b-2xl border-t border-gray-100 animate-fade-in">
            <div className="p-4 space-y-4">
              <Link
                to="/#how-it-works"
                className="block py-3 px-4 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl font-medium transition-all"
                onClick={() => setIsOpen(false)}
              >
                Comment ca marche
              </Link>
              <Link
                to="/#benefits"
                className="block py-3 px-4 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl font-medium transition-all"
                onClick={() => setIsOpen(false)}
              >
                Avantages
              </Link>

              {currentUser ? (
                <>
                  <Link
                    to={getDashboardLink()}
                    className="block py-3 px-4 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-xl font-medium transition-all"
                    onClick={() => setIsOpen(false)}
                  >
                    Mon espace
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsOpen(false);
                    }}
                    className="w-full py-3 px-4 text-left text-red-500 hover:bg-red-50 rounded-xl font-medium transition-all"
                  >
                    Deconnexion
                  </button>
                </>
              ) : (
                <Button
                  onClick={() => {
                    navigate('/auth');
                    setIsOpen(false);
                  }}
                  className="w-full"
                >
                  Se connecter
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
