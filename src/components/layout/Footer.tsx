import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Mail, MapPin, Phone } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Logo & Description */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-primary-600 to-primary-500 p-2.5 rounded-xl">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                Edu<span className="text-primary-400">Connect</span>
              </span>
            </Link>
            <p className="text-gray-400 leading-relaxed max-w-md">
              La plateforme qui connecte instantanement les eleves avec des professeurs
              qualifies pour des cours particuliers en visio. Aide immediate, resultats concrets.
            </p>
          </div>

          {/* Liens rapides */}
          <div>
            <h3 className="text-white font-semibold mb-6">Liens rapides</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/auth" className="hover:text-primary-400 transition-colors">
                  Connexion / Inscription
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-6">Contact</h3>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary-400" />
                <span>contact@educonnect.fr</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary-400" />
                <span>01 23 45 67 89</span>
              </li>
              <li className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-primary-400" />
                <span>Paris, France</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              &copy; {currentYear} Profolib. Tous droits reserves.
            </p>
            <div className="flex gap-6 text-sm">
              <Link to="/privacy" className="text-gray-500 hover:text-primary-400 transition-colors">
                Confidentialite
              </Link>
              <Link to="/terms" className="text-gray-500 hover:text-primary-400 transition-colors">
                Conditions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
