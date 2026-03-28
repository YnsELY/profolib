# EduConnect - Plateforme de Cours Instantanes

Une application web moderne pour mettre en relation instantanee des eleves et des professeurs pour des cours d'urgence en visio.

## Fonctionnalites

- Landing page moderne et attractive
- Authentification avec choix du role (eleve/professeur)
- Interface eleve : formulaire de demande, ecran d'attente, session visio
- Interface professeur : dashboard temps reel, acceptation de cours
- Communication temps reel avec Firebase
- Generation automatique de liens visio (Jitsi Meet)

## Technologies

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Firebase (Auth + Realtime Database)
- Framer Motion
- Lucide React Icons
- React Router

## Installation

1. Clonez le projet
2. Installez les dependances :
   ```bash
   npm install
   ```

3. Configurez Firebase :
   - Creez un projet Firebase sur https://console.firebase.google.com
   - Activez Authentication (Email/Password)
   - Activez Realtime Database
   - Copiez `.env.example` vers `.env` et remplissez vos credentials Firebase

4. Lancez le serveur de developpement :
   ```bash
   npm run dev
   ```

## Structure du projet

```
src/
├── components/
│   ├── layout/        # Navbar, Footer, Layout
│   └── ui/            # Button, Input, Card, etc.
├── config/            # Configuration Firebase
├── context/           # AuthContext
├── pages/
│   ├── student/       # Pages eleve
│   └── teacher/       # Pages professeur
├── services/          # Logique Firebase/API
└── types/             # Types TypeScript
```

## Routes

- `/` - Landing page
- `/auth` - Connexion/Inscription
- `/student/request` - Formulaire de demande
- `/student/waiting/:id` - Ecran d'attente
- `/student/session/:id` - Session de cours
- `/teacher/dashboard` - Dashboard professeur
- `/teacher/session/:id` - Session de cours

## Configuration Firebase

Regles Realtime Database recommandees :

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "requests": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```
