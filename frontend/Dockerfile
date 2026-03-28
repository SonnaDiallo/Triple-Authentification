# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copier les fichiers package
COPY package*.json ./

# Installer les dépendances
RUN npm ci

# Copier le code source
COPY . .

# Construire l'application
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Copier le build depuis le stage build
COPY --from=build /app/dist /usr/share/nginx/html

# Copier la configuration nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exposer le port
EXPOSE 5173

# Démarrer nginx
CMD ["nginx", "-g", "daemon off;"]
