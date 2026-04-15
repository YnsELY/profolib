# EduConnect - Guide pour Agents de Code

Ce document contient les informations essentielles pour comprendre et travailler sur le projet EduConnect.

## Vue d'ensemble du projet

**EduConnect** est une application web moderne de mise en relation instantanée entre élèves et professeurs pour des cours d'urgence en visioconférence.

### Fonctionnalités principales
- Landing page moderne et attractive
- Authentification avec choix du rôle (élève/professeur)
- Interface élève : formulaire de demande, écran d'attente, session visio
- Interface professeur : dashboard temps réel, acceptation de cours, cagnotte
- Communication temps réel avec Supabase Realtime
- Génération automatique de liens visio (Jitsi Meet)
- Système de tarification et cagnotte pour les professeurs

## Stack technique

| Catégorie | Technologie |
|-----------|-------------|
| Framework frontend | React 18 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS 3.4 |
| Animation | Framer Motion |
| Icons | Lucide React |
| Routing | React Router DOM |
| Backend/Auth | Supabase (PostgreSQL + Auth + Realtime) |
| Fallback | Firebase (Auth + Realtime Database) |
| Vidéo | Jitsi Meet (via liens générés) |

## Structure du projet

```
educonnect-instant/
├── src/
│   ├── components/
│   │   ├── layout/           # Navbar, Footer, Layout
│   │   │   ├── Footer.tsx
│   │   │   ├── Layout.tsx
│   │   │   ├── Navbar.tsx
│   │   │   └── index.ts
│   │   ├── ui/               # Composants réutilisables
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Loader.tsx
│   │   │   ├── Select.tsx
│   │   │   └── index.ts
│   │   └── ProtectedRoute.tsx
│   ├── config/
│   │   ├── firebase.ts       # Configuration Firebase (fallback)
│   │   └── supabase.ts       # Configuration Supabase
│   ├── context/
│   │   └── AuthContext.tsx   # Contexte d'authentification
│   ├── pages/
│   │   ├── student/          # Pages élève
│   │   │   ├── RequestPage.tsx
│   │   │   ├── WaitingPage.tsx
│   │   │   ├── SessionPage.tsx
│   │   │   └── index.ts
│   │   ├── teacher/          # Pages professeur
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── SessionPage.tsx
│   │   │   └── index.ts
│   │   ├── AuthPage.tsx
│   │   ├── LandingPage.tsx
│   │   └── index.ts
│   ├── services/
│   │   ├── requests.ts       # Logique des demandes de cours
│   │   ├── wallet.ts         # Logique de la cagnotte
│   │   └── index.ts
│   ├── types/
│   │   └── index.ts          # Types TypeScript
│   ├── main.tsx              # Point d'entrée
│   ├── App.tsx               # Configuration des routes
│   ├── index.css             # Styles globaux + Tailwind
│   └── vite-env.d.ts
├── supabase/
│   └── migrations/           # Migrations SQL
│       ├── 002_pricing_and_wallet.sql
│       └── 003_wallet_rls_policies.sql
├── supabase.sql              # Schéma initial
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

## Configuration et installation

### Prérequis
- Node.js 18+
- npm ou yarn

### Installation des dépendances
```bash
npm install
```

### Configuration des variables d'environnement

Créer un fichier `.env` à la racine avec :

```env
# Supabase Configuration
VITE_SUPABASE_ANNON_KEY=your-supabase-anon-key
VITE_SUPABASE_DATABASE_URL=https://your-project.supabase.co

# Daily.co API (pour la visio)
VITE_DAILY_API_KEY=your-daily-api-key
```

**Note** : Si Supabase n'est pas configuré, l'application fonctionne automatiquement en **mode démo** avec des données locales.

### Commandes disponibles

```bash
# Développement local
npm run dev

# Build de production
npm run build

# Linting
npm run lint

# Preview du build
npm run preview
```

## Architecture de l'application

### Routage

| Route | Description | Rôle requis |
|-------|-------------|-------------|
| `/` | Landing page | Public |
| `/auth` | Connexion/Inscription | Public (redirige si connecté) |
| `/student/request` | Formulaire de demande | student |
| `/student/waiting/:requestId` | Écran d'attente | student |
| `/student/session/:id` | Session de cours | student |
| `/teacher/dashboard` | Dashboard professeur | teacher |
| `/teacher/session/:id` | Session de cours | teacher |

### Authentification

Le système d'authentification supporte deux modes :

1. **Mode Supabase** (production) : Auth via Supabase avec persistance dans PostgreSQL
2. **Mode Démo** (développement) : Auth locale sans backend, données stockées dans localStorage

Comptes de démo (mode démo uniquement) :
- Élève : `eleve@demo.com` / n'importe quel mot de passe
- Professeur : `prof@demo.com` / n'importe quel mot de passe

### Types principaux

```typescript
// Rôles utilisateur
type UserRole = 'student' | 'teacher';

// Statuts de demande
type RequestStatus = 'pending' | 'accepted' | 'completed' | 'cancelled';

// Utilisateur
interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  subjects?: string[];  // Pour les professeurs
  createdAt: Date;
}

// Demande de cours
interface CourseRequest {
  id: string;
  studentId: string;
  studentName: string;
  subject: string;
  level: string;
  description: string;
  status: RequestStatus;
  teacherId?: string;
  teacherName?: string;
  videoLink?: string;
  createdAt: Date;
  acceptedAt?: Date;
  durationMinutes: number;
  studentPrice: number;
  teacherRevenue: number;
  platformCommission: number;
  paymentStatus: PaymentStatus;
}
```

### Services

#### `services/requests.ts`
Gère les demandes de cours :
- `createCourseRequest()` - Créer une demande
- `acceptRequest()` - Accepter une demande (professeur)
- `cancelRequest()` - Annuler une demande
- `completeRequest()` - Marquer comme complété
- `subscribeToRequest()` - Souscription temps réel à une demande
- `subscribeToPendingRequests()` - Souscription aux demandes en attente

#### `services/wallet.ts`
Gère la cagnotte des professeurs :
- `getTeacherWallet()` - Récupérer la cagnotte
- `getWalletTransactions()` - Historique des transactions
- `creditTeacherWallet()` - Créditer après un cours
- `requestWithdrawal()` - Demander un retrait

### Base de données (Supabase)

#### Tables principales

**profiles** : Profils utilisateurs
- `id` (UUID, PK) - Référence auth.users
- `email` (text)
- `name` (text)
- `role` (text) - 'student' ou 'teacher'
- `subjects` (text[]) - Matières enseignées (professeurs)
- `created_at` (timestamptz)

**course_requests** : Demandes de cours
- `id` (UUID, PK)
- `student_id` (UUID, FK)
- `student_name` (text)
- `subject` (text)
- `level` (text)
- `description` (text)
- `status` (enum) - pending/accepted/completed/cancelled
- `teacher_id` (UUID, FK, nullable)
- `video_link` (text, nullable)
- `duration_minutes` (integer)
- `student_price` (decimal)
- `teacher_revenue` (decimal)
- `platform_commission` (decimal)
- `payment_status` (enum)

**teacher_wallets** : Cagnottes des professeurs
- `id` (UUID, PK)
- `teacher_id` (UUID, FK)
- `balance` (decimal)
- `total_earned` (decimal)
- `total_withdrawn` (decimal)

**wallet_transactions** : Transactions
- `id` (UUID, PK)
- `wallet_id` (UUID, FK)
- `course_request_id` (UUID, FK, nullable)
- `type` (enum) - earning/withdrawal/refund/bonus
- `amount` (decimal)
- `description` (text)
- `status` (enum)

#### RLS (Row Level Security)

- Les professeurs peuvent uniquement voir/modifier leur propre cagnotte
- Les utilisateurs peuvent voir uniquement leur propre profil
- Les demandes sont lisibles par tous les utilisateurs authentifiés

### Grille tarifaire

| Durée | Prix élève | Revenu prof | Commission |
|-------|------------|-------------|------------|
| 10 min | 3,00 € | 2,00 € | 1,00 € |
| 20 min | 5,00 € | 3,50 € | 1,50 € |
| 30 min | 7,50 € | 5,50 € | 2,00 € |
| 45 min | 11,00 € | 8,50 € | 2,50 € |
| 60 min | 14,00 € | 11,00 € | 3,00 € |
| 120 min | 26,00 € | 21,00 € | 5,00 € |

## Conventions de code

### Style de code
- TypeScript strict activé
- ESLint pour le linting
- Imports avec alias `@/` pointant vers `src/`
- Composants React en PascalCase
- Hooks personnalisés en camelCase préfixés par `use`
- Services/fonctions utilitaires en camelCase

### Organisation des imports
```typescript
// 1. Imports React/bibliothèques
import React from 'react';
import { useNavigate } from 'react-router-dom';

// 2. Imports internes (alias)
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui';

// 3. Imports types
import type { User } from '@/types';
```

### Composants UI
Les composants UI réutilisables acceptent des props standardisées :
- `variant` - Variante visuelle (primary, secondary, outline, ghost)
- `size` - Taille (sm, md, lg)
- `isLoading` - État de chargement
- `className` - Classes CSS additionnelles

### Gestion des états de chargement
Utiliser le composant `Loader` pour les états de chargement globaux :
```tsx
if (loading) {
  return <Loader size="lg" text="Chargement..." />;
}
```

### Gestion des erreurs
Les erreurs sont logguées dans la console avec un préfixe descriptif :
```typescript
console.error('[serviceName] functionName:error', error);
```

## Sécurité

### Variables d'environnement
- Toutes les clés API côté client sont préfixées par `VITE_`
- Ne jamais committer le fichier `.env`
- Utiliser des clés anonymes (anon key) pour Supabase, jamais la service key

### RLS Policies
Toutes les tables ont des policies RLS activées :
- `profiles` : CRUD uniquement sur son propre profil
- `course_requests` : Lecture pour utilisateurs authentifiés
- `teacher_wallets` : Accès uniquement à sa propre cagnotte

### Validation des données
- Validation côté client avec TypeScript
- Validation côté serveur via contraintes PostgreSQL
- Sanitization des entrées utilisateur

## Développement

### Mode démo
Lorsque Supabase n'est pas configuré, l'application fonctionne en mode démo :
- Données stockées en mémoire et localStorage
- Authentification simulée
- Souscriptions temps réel simulées via EventEmitter
- Données de démo initialisées automatiquement

### Ajout d'une nouvelle page
1. Créer le composant dans `src/pages/` ou sous-dossier
2. Exporter depuis `src/pages/index.ts`
3. Ajouter la route dans `src/App.tsx`
4. Ajouter le composant à `ProtectedRoute` si nécessaire

### Ajout d'un composant UI
1. Créer le composant dans `src/components/ui/`
2. Exporter depuis `src/components/ui/index.ts`
3. Définir les props dans `src/types/index.ts` si réutilisable

### Modifications de la base de données
1. Créer une nouvelle migration dans `supabase/migrations/`
2. Nommer avec le format `XXX_description.sql`
3. Tester en local avant déploiement
4. Mettre à jour `supabase.sql` si c'est une modification structurelle majeure

## Déploiement

### Build de production
```bash
npm run build
```
Le build est généré dans le dossier `dist/`.

### Variables d'environnement production
Assurez-vous de définir toutes les variables `VITE_*` dans l'environnement de production.

### Hébergement recommandé
- **Frontend** : Vercel, Netlify, ou Cloudflare Pages
- **Backend** : Supabase (déjà géré)
- **Vidéo** : Jitsi Meet (gratuit, sans compte requis)

## Ressources utiles

- [Documentation React](https://react.dev/)
- [Documentation Vite](https://vitejs.dev/guide/)
- [Documentation Tailwind CSS](https://tailwindcss.com/docs)
- [Documentation Supabase](https://supabase.com/docs)
- [Documentation Framer Motion](https://www.framer.com/motion/)
