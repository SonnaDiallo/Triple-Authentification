# Utiliser l'image Node.js officielle
FROM node:18-alpine AS base

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers package
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production && npm cache clean --force

# Copier le code source
COPY . .

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Changer les permissions
RUN chown -R nodejs:nodejs /app
USER nodejs

# Exposer le port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Démarrer l'application
CMD ["npm", "start"]
