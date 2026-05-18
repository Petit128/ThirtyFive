const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'edulearn',
  user: 'postgres',
  password: 'petit', // Votre mot de passe PostgreSQL
});

async function createAdmin() {
  try {
    console.log(' Création de l\'utilisateur admin...');
    
    // Hash du mot de passe
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log(' Hash généré:', hashedPassword);
    
    // Insérer l'admin
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role) 
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) 
       DO UPDATE SET password = $3, role = $4
       RETURNING id, name, email, role`,
      ['Admin User', 'admin@school.com', hashedPassword, 'admin']
    );
    
    console.log(' Admin créé avec succès:', result.rows[0]);
    
    // Vérifier la connexion
    const testPassword = 'admin123';
    const isValid = await bcrypt.compare(testPassword, hashedPassword);
    console.log('🔑 Test de connexion:', isValid ? '✅ OK' : '❌ Échec');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await pool.end();
  }
}

createAdmin();