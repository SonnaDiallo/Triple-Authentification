Voilà le README retravaillé — style humain, phrases naturelles, sans sur-explication :

---

# Triple Auth

Triple Auth est une démonstration de système d'authentification multi-facteurs, conçue pour explorer comment combiner plusieurs étapes de vérification tout en maintenant une expérience utilisateur fluide.

## Stack technique

- **Frontend** : React + Vite
- **Backend** : Express.js
- **Base de données** : Cloud Firestore
- **SDK serveur** : Firebase Admin SDK

## Structure du projet

Le projet se divise en deux dossiers distincts :

- `frontend/` — l'interface web React
- `backend/` — l'API REST et la logique d'authentification

Firebase Admin est initialisé exclusivement côté backend, ce qui évite d'exposer des clés sensibles dans le navigateur.

## Installation de Firebase

1. Créer un projet depuis la [console Firebase](https://console.firebase.google.com)
2. Activer Firestore (mode test ou production selon les besoins)
3. Générer une clé de compte de service dans les paramètres du projet
4. Télécharger le fichier JSON obtenu

## Configuration

Deux façons de fournir les credentials Firebase au backend :

**Option 1 — fichier local :** Placer le JSON dans `backend/` et renseigner dans `.env` :
```
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccount.json
```

**Option 2 — variable Google :**
```
GOOGLE_APPLICATION_CREDENTIALS=chemin/vers/fichier.json
```

> Ne jamais versionner le fichier JSON Firebase dans Git.

## Variables d'environnement

Créer un fichier `backend/.env` avec les valeurs suivantes :
```
SESSION_SECRET=une_chaine_aleatoire_longue
GMAIL_USER=votre_email@gmail.com
GMAIL_PASS=mot_de_passe_application
```

Pour `GMAIL_PASS`, il faut générer un mot de passe d'application depuis les paramètres de sécurité Google (16 caractères) :
https://myaccount.google.com/apppasswords

## Lancement du projet

**Backend :**
```bash
cd backend
npm install
npm start
```

**Frontend :**
```bash
cd frontend
npm install
npm run dev
```

Vite affiche l'URL locale au démarrage, généralement `http://localhost:5173`.

## Fonctionnement de l'authentification

La connexion se déroule en trois étapes successives :

1. **Mot de passe** — vérification classique du couple identifiant / mot de passe
2. **Question secrète** — question personnelle choisie à l'inscription
3. **Code email** — code à 6 chiffres envoyé en temps réel par mail

Chaque étape doit être validée avant de passer à la suivante. Toute tentative de contournement est bloquée côté serveur.

## Base de données

Les comptes utilisateurs sont stockés dans la collection `users` de Firestore. Chaque document contient le nom, le prénom, l'adresse email, le mot de passe haché avec bcrypt, la question secrète et sa réponse hachée, ainsi que le rôle attribué (admin ou user).

## Sécurité

Plusieurs mécanismes sont mis en place pour renforcer la robustesse du système : sessions Express sécurisées par un secret aléatoire, rate limiting sur les routes d'authentification, hachage bcrypt des données sensibles, journalisation structurée des événements, et détection automatique des tentatives de brute force.

## Dashboard administrateur

En se connectant avec un compte admin, on accède à un espace dédié qui regroupe un tableau de bord de sécurité en temps réel, les métriques d'authentification, l'historique complet des tentatives de connexion et les alertes actives.

## Problèmes courants

**Firestore inaccessible** — erreur `PERMISSION_DENIED` ou `SERVICE_DISABLED` : vérifier que Firestore est bien activé dans la console Firebase.

**Emails non reçus** — s'assurer que `GMAIL_PASS` correspond à un mot de passe d'application de 16 caractères, et non au mot de passe du compte Google.

**Sessions perdues** — vérifier que `SESSION_SECRET` est bien défini dans `.env` et redémarrer le serveur après toute modification des variables d'environnement.

## Déploiement avec Docker

Pour démarrer l'ensemble du projet en une commande :

```bash
git clone <votre-repo>
cd triple-auth

cp backend/.env.example backend/.env
# Renseigner les variables dans backend/.env

docker-compose up -d
```

Services accessibles :
- Frontend : `http://localhost:5173`
- API backend : `http://localhost:3000`
- Reverse proxy : `http://localhost:80` (optionnel)

**Variables requises dans Docker :**
- `SESSION_SECRET` — secret de session
- `GMAIL_USER` — adresse Gmail pour l'envoi des codes
- `GMAIL_PASS` — mot de passe d'application Gmail
- `FIREBASE_SERVICE_ACCOUNT_PATH` — chemin vers le fichier JSON Firebase

**Commandes utiles en développement :**
```bash
docker-compose up backend        # backend seul
docker-compose up frontend       # frontend seul
docker-compose logs -f           # suivi des logs en direct
docker-compose up --build        # reconstruction après modification
```

## Note

Ce projet est avant tout une démonstration technique. L'objectif principal était de montrer comment articuler une authentification multi-facteurs avec un module de monitoring, dans un contexte pédagogique.