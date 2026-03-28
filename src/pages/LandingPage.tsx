import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView, useAnimation } from 'framer-motion';
import {
  Zap,
  CheckCircle,
  Video,
  ArrowRight,
  Star,
  Shield,
  Sparkles,
  MousePointer,
  Send,
  MessageCircle,
} from 'lucide-react';
import { Layout } from '../components/layout';
import { Button, Card } from '../components/ui';

// Animation wrapper component
const AnimatedSection: React.FC<{ children: React.ReactNode; delay?: number }> = ({
  children,
  delay = 0,
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start('visible');
    }
  }, [isInView, controls]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: { opacity: 0, y: 50 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.6, delay, ease: 'easeOut' },
        },
      }}
    >
      {children}
    </motion.div>
  );
};

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const steps = [
    {
      icon: <MousePointer className="w-8 h-8" />,
      title: 'Decrivez votre besoin',
      description: 'Selectionnez la matiere, votre niveau et decrivez votre probleme en quelques mots.',
    },
    {
      icon: <Send className="w-8 h-8" />,
      title: 'Un professeur accepte',
      description: 'Votre demande est envoyee instantanement a tous les profs disponibles. Le premier qui repond prend le cours.',
    },
    {
      icon: <Video className="w-8 h-8" />,
      title: 'Cours en visio immediat',
      description: 'Un lien de visioconference est genere automatiquement. Rejoignez le cours en un clic.',
    },
  ];

  const benefits = [
    {
      icon: <Zap className="w-7 h-7" />,
      title: 'Instantane',
      description: 'Pas besoin de planifier a l\'avance. Un professeur disponible en quelques minutes.',
      color: 'from-yellow-400 to-orange-500',
    },
    {
      icon: <MousePointer className="w-7 h-7" />,
      title: 'Simple',
      description: '3 clics suffisent pour etre en cours avec un professeur qualifie.',
      color: 'from-green-400 to-emerald-500',
    },
    {
      icon: <CheckCircle className="w-7 h-7" />,
      title: 'Efficace',
      description: 'Des professeurs verifies et experimentes pour des resultats concrets.',
      color: 'from-blue-400 to-indigo-500',
    },
    {
      icon: <Shield className="w-7 h-7" />,
      title: 'Securise',
      description: 'Visioconference securisee et donnees personnelles protegees.',
      color: 'from-purple-400 to-pink-500',
    },
  ];

  const testimonials = [
    {
      name: 'Marie L.',
      role: 'Eleve de Terminale',
      content: 'J\'avais un exercice de maths que je ne comprenais pas la veille du bac. En 10 minutes j\'etais en visio avec un prof genial !',
      avatar: 'M',
      rating: 5,
    },
    {
      name: 'Thomas D.',
      role: 'Professeur de Physique',
      content: 'Une plateforme intuitive qui me permet d\'aider des eleves quand j\'ai du temps libre. Excellent concept !',
      avatar: 'T',
      rating: 5,
    },
    {
      name: 'Sophie R.',
      role: 'Parent d\'eleve',
      content: 'Mon fils peut avoir de l\'aide immediate quand il bloque sur ses devoirs. C\'est vraiment pratique !',
      avatar: 'S',
      rating: 5,
    },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-500 to-primary-400">
          {/* Animated circles */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary-300/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl"></div>

          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNDB2NDBoLTQweiIvPjxwYXRoIGQ9Ik00MCAwdjQwaC00MHYtNDB6bS0xIDFoLTM4djM4aDM4di0zOHoiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L2c+PC9zdmc+')] opacity-30"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white/90 text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              Cours particuliers nouvelle generation
            </div>

            {/* Main heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Besoin d'aide ?
              <br />
              <span className="text-white/90">Un prof en</span>{' '}
              <span className="relative">
                <span className="relative z-10">quelques minutes</span>
                <span className="absolute bottom-2 left-0 right-0 h-4 bg-white/20 -skew-x-3 rounded"></span>
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto mb-12 leading-relaxed">
              Connectez-vous instantanement avec un professeur disponible
              <br className="hidden md:block" />
              pour un cours en visio. Aide immediate, resultats concrets.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  onClick={() => navigate('/auth')}
                  className="bg-white text-primary-600 hover:bg-white/90 hover:text-primary-700 shadow-xl px-8 py-4 text-lg font-semibold"
                >
                  Commencer maintenant
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-white hover:bg-white/10 border-2 border-white/30"
              >
                Decouvrir comment ca marche
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              {[
                { value: '500+', label: 'Professeurs' },
                { value: '5min', label: 'Temps moyen' },
                { value: '98%', label: 'Satisfaction' },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-white/70 text-sm">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          >
            <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-1">
              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-1.5 h-1.5 bg-white rounded-full"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works Section */}
      <section id="how-it-works" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-4">
                Simple et rapide
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Comment ca marche ?
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                En 3 etapes simples, obtenez l'aide dont vous avez besoin
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <AnimatedSection key={step.title} delay={index * 0.15}>
                <div className="relative">
                  {/* Connector line */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-16 left-[60%] w-full h-0.5 bg-gradient-to-r from-primary-300 to-transparent"></div>
                  )}

                  <Card className="relative bg-white p-8 text-center h-full" hover>
                    {/* Step number */}
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                      {index + 1}
                    </div>

                    {/* Icon */}
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-2xl shadow-lg mb-6 mt-4">
                      {step.icon}
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-4">{step.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{step.description}</p>
                  </Card>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-4">
                Pourquoi nous choisir
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Les avantages EduConnect
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Une experience d'apprentissage repensee pour vos besoins
              </p>
            </div>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {benefits.map((benefit, index) => (
              <AnimatedSection key={benefit.title} delay={index * 0.1}>
                <Card className="h-full p-8 border border-gray-100" hover>
                  <div className={`inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br ${benefit.color} text-white rounded-xl shadow-lg mb-6`}>
                    {benefit.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Features showcase */}
      <section className="py-24 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <AnimatedSection>
              <span className="inline-block px-4 py-1.5 bg-primary-500/20 text-primary-300 rounded-full text-sm font-medium mb-6">
                Pour les eleves
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Une aide immediate quand vous en avez besoin
              </h2>
              <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                Fini les blocages sur les devoirs. Avec EduConnect, un professeur
                est toujours disponible pour vous debloquer et vous expliquer ce que vous ne comprenez pas.
              </p>
              <ul className="space-y-4">
                {[
                  'Professeurs disponibles 7j/7',
                  'Toutes les matieres du college au superieur',
                  'Cours en visio HD avec partage d\'ecran',
                  'Historique de vos cours accessible',
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-primary-400 flex-shrink-0" />
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="mt-8"
                size="lg"
                onClick={() => navigate('/auth')}
              >
                Je suis eleve
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-primary-600 rounded-3xl blur-2xl opacity-20 transform rotate-6"></div>
                <div className="relative bg-gradient-to-br from-gray-800 to-gray-700 rounded-3xl p-8 shadow-2xl border border-gray-700">
                  {/* Mock student interface */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-gray-600/50 rounded-xl p-4">
                      <div className="text-sm text-gray-400 mb-2">Matiere</div>
                      <div className="text-white font-medium">Mathematiques</div>
                    </div>
                    <div className="bg-gray-600/50 rounded-xl p-4">
                      <div className="text-sm text-gray-400 mb-2">Niveau</div>
                      <div className="text-white font-medium">Terminale</div>
                    </div>
                    <div className="bg-gray-600/50 rounded-xl p-4">
                      <div className="text-sm text-gray-400 mb-2">Besoin</div>
                      <div className="text-white font-medium">Je ne comprends pas les integrales...</div>
                    </div>
                    <div className="bg-gradient-to-r from-primary-600 to-primary-500 rounded-xl p-4 text-center font-semibold">
                      Trouver un professeur
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>

          {/* For teachers */}
          <div className="grid lg:grid-cols-2 gap-16 items-center mt-32">
            <AnimatedSection delay={0.2} >
              <div className="relative order-2 lg:order-1">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl blur-2xl opacity-20 transform -rotate-6"></div>
                <div className="relative bg-gradient-to-br from-gray-800 to-gray-700 rounded-3xl p-8 shadow-2xl border border-gray-700">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1 rounded-full">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-400 text-sm">En ligne</span>
                    </div>
                  </div>
                  <div className="text-center text-gray-400 mb-4">Nouvelle demande !</div>
                  <div className="bg-gray-600/50 rounded-xl p-6 border-2 border-primary-500/50">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold">
                        L
                      </div>
                      <div>
                        <div className="text-white font-medium">Lucas</div>
                        <div className="text-gray-400 text-sm">Terminale - Mathematiques</div>
                      </div>
                    </div>
                    <div className="text-gray-300 text-sm mb-4">
                      "Besoin d'aide sur les integrales par parties..."
                    </div>
                    <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-xl p-3 text-center font-semibold text-white">
                      Accepter le cours
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection>
              <div className="order-1 lg:order-2">
                <span className="inline-block px-4 py-1.5 bg-green-500/20 text-green-300 rounded-full text-sm font-medium mb-6">
                  Pour les professeurs
                </span>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Enseignez quand vous le souhaitez
                </h2>
                <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                  Mettez votre expertise au service des eleves en difficulte.
                  Choisissez vos horaires et aidez ceux qui en ont besoin, depuis chez vous.
                </p>
                <ul className="space-y-4">
                  {[
                    'Flexibilite totale sur vos disponibilites',
                    'Remuneration attractive (a venir)',
                    'Interface simple et intuitive',
                    'Support technique disponible',
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-8 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
                  size="lg"
                  onClick={() => navigate('/auth')}
                >
                  Je suis professeur
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-4">
                Temoignages
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Ils nous font confiance
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Decouvrez ce que nos utilisateurs pensent d'EduConnect
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <AnimatedSection key={testimonial.name} delay={index * 0.1}>
                <Card className="h-full p-8" hover>
                  {/* Stars */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>

                  {/* Quote */}
                  <p className="text-gray-700 leading-relaxed mb-6 italic">
                    "{testimonial.content}"
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-500">{testimonial.role}</div>
                    </div>
                  </div>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-500 to-primary-400">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNDB2NDBoLTQweiIvPjxwYXRoIGQ9Ik00MCAwdjQwaC00MHYtNDB6bS0xIDFoLTM4djM4aDM4di0zOHoiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L2c+PC9zdmc+')] opacity-30"></div>
          <div className="absolute top-20 right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-primary-300/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white/90 text-sm font-medium mb-8">
              <MessageCircle className="w-4 h-4" />
              Pret a commencer ?
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
              Lancez-vous des maintenant
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto mb-10">
              Rejoignez la communaute EduConnect et transformez votre facon d'apprendre
              ou d'enseigner.
            </p>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                size="lg"
                onClick={() => navigate('/auth')}
                className="bg-white text-primary-600 hover:bg-white/90 hover:text-primary-700 shadow-xl px-10 py-5 text-lg font-semibold"
              >
                Creer mon compte gratuitement
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>
    </Layout>
  );
};

export default LandingPage;
