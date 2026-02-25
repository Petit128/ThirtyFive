// backend/sync-ids.js
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'edulearn',
  user: 'postgres',
  password: 'petit',
});

async function syncIds() {
  try {
    // Voir les IDs actuels
    const result = await pool.query('SELECT id, title FROM lessons ORDER BY id');
    
    console.log('\n📚 IDs actuels dans la base:\n');
    result.rows.forEach(lesson => {
      console.log(`ID ${lesson.id}: ${lesson.title}`);
    });
    
    // S'assurer que les IDs sont séquentiels
    let nextId = 1;
    for (const lesson of result.rows) {
      if (lesson.id !== nextId) {
        console.log(`\n⚠️ ID ${lesson.id} devrait être ${nextId}`);
        // Correction si nécessaire
        await pool.query(
          'UPDATE lessons SET id = $1 WHERE id = $2',
          [nextId, lesson.id]
        );
        console.log(`✅ ID ${lesson.id} → ${nextId}`);
      }
      nextId++;
    }
    
    console.log('\n✅ IDs synchronisés');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await pool.end();
  }
}

syncIds();