# Triple Auth

C'est une démo de système d'authentification multi-facteurs. J'ai fait ça pour tester comment combiner plusieurs étapes de sécurité.

## Stack technique

- React avec Vite pour le frontend
- Express.js pour le backend  
- Firestore pour la base de données
- Firebase Admin SDK côté serveur

## Structure du projet

Le projet est divisé en deux parties :

- `frontend/` : l'interface web en React
- `backend/` : l'API REST et toute la logique d'authentification

J'utilise Firebase Admin uniquement côté backend, donc aucune clé secrète n'est exposée côté client.

## Installation de Firebase

1. Créer un projet sur la console Firebase
2. Activer Firestore (mode test ou production)
3. Générer une clé de compte de service
4. Télécharger le fichier JSON

## Configuration

Deux options pour le fichier Firebase :

**Option 1 :** Mettre le JSON dans `backend/` et ajouter dans `.env` :
```
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccount.json
```

**Option 2 :** Utiliser la variable d'environnement Google :
```
GOOGLE_APPLICATION_CREDENTIALS=chemin/vers/fichier.json
```

Important : ne jamais commit le fichier JSON !

## Variables d'environnement

Dans `backend/.env` :
```
SESSION_SECRET=une_chaine_aleatoire_longue
GMAIL_USER=votre_email@gmail.com
GMAIL_PASS=mot_de_passe_application
```

Pour Gmail, il faut créer un mot de passe d'application (16 caractères) depuis :
https://myaccount.google.com/apppasswords

## Lancer le projet

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

Ouvrir l'URL affichée par Vite (généralement localhost:5173).

## Fonctionnement

L'authentification se fait en 3 étapes :

1. **Mot de passe** : Vérification classique username/password
2. **Question secrète** : Question personnelle prédéfinie
3. **Code email** : Code à 6 chiffres envoyé par mail

## Base de données

Les utilisateurs sont stockés dans la collection `users` de Firestore.

Chaque utilisateur contient :
- nom, prénom, email
- mot de passe hashé avec bcrypt
- question secrète et réponse hashée
- rôle (admin ou user)

## Sécurité

- Sessions Express avec secret aléatoire
- Rate limiting sur les tentatives de connexion
- Hashage des mots de passe avec bcrypt
- Logs structurés pour le monitoring
- Détection automatique du brute force

## Dashboard admin

Si vous vous connectez en tant qu'admin, vous avez accès à :
- Un tableau de bord de sécurité en temps réel
- Les métriques d'authentification
- L'historique des tentatives de connexion
- Les alertes de sécurité

## Problèmes courants

**Firestore non activé :**
- Erreur PERMISSION_DENIED ou SERVICE_DISABLED
- Solution : activer Firestore dans la console Firebase

**Email qui ne s'envoie pas :**
- Vérifier le mot de passe d'application Gmail
- Utiliser un mot de passe de 16 caractères, pas le mot de passe normal

**Session qui ne marche pas :**
- Vérifier que SESSION_SECRET est défini dans .env
- Redémarrer le serveur après avoir modifié les variables

## Docker (Lancement rapide)

Pour lancer tout le projet avec Docker :

```bash
# Cloner le projet
git clone <votre-repo>
cd triple-auth

# Configurer les variables d'environnement
cp backend/.env.example backend/.env
# Éditer backend/.env avec vos configurations

# Lancer avec Docker Compose
docker-compose up -d

# Arrêter
docker-compose down
```

Services disponibles :
- Frontend : http://localhost:5173
- Backend API : http://localhost:3000
- Reverse proxy : http://localhost:80 (optionnel)

**Variables Docker requises :**
- `SESSION_SECRET` : Secret pour les sessions
- `GMAIL_USER` : Email Gmail pour l'envoi de codes
- `GMAIL_PASS` : Mot de passe d'application Gmail
- `FIREBASE_SERVICE_ACCOUNT_PATH` : Chemin vers le fichier JSON Firebase

**Développement avec Docker :**
```bash
# Lancer seulement le backend
docker-compose up backend

# Lancer seulement le frontend  
docker-compose up frontend

# Voir les logs
docker-compose logs -f

# Reconstruire après modification
docker-compose up --build
```

## Notes

C'est une démo, donc pas de gestion d'erreurs super poussée ni de tests unitaires. Le but était surtout de montrer comment implémenter une authentification multi-facteurs avec monitoring.