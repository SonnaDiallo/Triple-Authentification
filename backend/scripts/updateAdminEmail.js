const { db } = require('../firebase');
require('dotenv').config();

const USERS = process.env.FIRESTORE_USERS_COLLECTION || 'users';

async function updateAdminEmail() {
  try {
    console.log('🔧 Mise à jour de l\'email de l\'utilisateur admin...');
    
    // Votre vrai email (MODIFIEZ CETTE LIGNE)
    const nouvelEmail = 'votre.email@gmail.com'; // Remplacez par votre vrai email
    
    // Mise à jour dans Firestore
    await db().collection(USERS).doc('admin').update({
      email: nouvelEmail,
      updatedAt: new Date().toISOString()
    });
    
    console.log('✅ Email admin mis à jour avec succès !');
    console.log('📧 Nouvel email:', nouvelEmail);
    console.log('📧 Les codes OTP seront maintenant envoyés à cette adresse.');
  } catch (error) {
    if (error.code === 5) {
      console.log('❌ L\'utilisateur admin n\'existe pas.');
      console.log('   Exécutez d\'abord: node scripts/createAdmin.js');
    } else {
      console.error('❌ Erreur lors de la mise à jour:', error);
    }
  }
}
// Exécuter le script
updateAdminEmail().then(() => {
  console.log('🎉 Script terminé.');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
});
