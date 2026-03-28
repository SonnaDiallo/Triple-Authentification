const { db } = require('../firebase');
require('dotenv').config();

const USERS = process.env.FIRESTORE_USERS_COLLECTION || 'users';

async function deleteAdminUser() {
  try {
    console.log('🗑️ Suppression de l\'utilisateur admin...');
    
    // Suppression dans Firestore
    await db().collection(USERS).doc('admin').delete();
    
    console.log('✅ Utilisateur admin supprimé avec succès !');
    console.log('📝 Vous pouvez maintenant le recréer avec:');
    console.log('   node scripts/createAdmin.js');
    
  } catch (error) {
    if (error.code === 5) {
      console.log('ℹ️  L\'utilisateur admin n\'existe pas.');
      console.log('   Vous pouvez le créer avec: node scripts/createAdmin.js');
    } else {
      console.error('❌ Erreur lors de la suppression:', error);
    }
  }
}

// Exécuter le script
deleteAdminUser().then(() => {
  console.log('🎉 Script terminé.');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
});
