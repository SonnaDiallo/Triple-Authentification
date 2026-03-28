const bcrypt = require('bcryptjs');
require('dotenv').config();

// Initialiser Firebase manuellement
const { initFirebase } = require('../firebase');

const USERS = process.env.FIRESTORE_USERS_COLLECTION || 'users';

async function createAdminUser() {
  try {
    console.log('🔧 Initialisation de Firebase...');
    initFirebase(); // Initialiser Firebase
    
    console.log('🔧 Création de l\'utilisateur admin...');
    
    // Données de l'admin
    const adminData = {
      nom: 'Administrateur',
      prenom: 'Système',
      adresse: 'Admin Server',
      username: 'admin',
      email: 'sogonayasminediallo@gmail.com', // Remplacez par votre vrai email
      hashedPassword: await bcrypt.hash('admin123', 12),
      secretQuestion: 'Quel est le nom du framework utilisé pour le backend ?',
      hashedAnswer: await bcrypt.hash('express', 10),
      role: 'admin', // Rôle spécial pour l'accès aux logs
      createdAt: new Date().toISOString(),
    };

    // Création dans Firestore
    const { db } = require('../firebase');
    await db().collection(USERS).doc('admin').create(adminData);
    
    console.log('✅ Utilisateur admin créé avec succès !');
    console.log('📋 Identifiants de connexion :');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   Email: votre.email@gmail.com (à remplacer dans le script)');
    console.log('   Question secrète: Quel est le nom du framework utilisé pour le backend ?');
    console.log('   Réponse: express');
    console.log('');
    console.log('🔐 Cet utilisateur a accès à la page de logs administrateur.');
    console.log('📧 Le code OTP sera envoyé à votre email personnel.');
    
  } catch (error) {
    if (error.code === 6 || error.code === 'already-exists') {
      console.log('ℹ️  L\'utilisateur admin existe déjà.');
      console.log('   Si vous voulez le recréer, supprimez-le d\'abord de Firestore.');
    } else {
      console.error('❌ Erreur lors de la création:', error);
    }
  }
}

// Exécuter le script
createAdminUser().then(() => {
  console.log('🎉 Script terminé.');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
});
