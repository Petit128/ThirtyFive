const { query, transaction } = require('../config/database');

class Lesson {
  // Create new lesson
  static async create(lessonData) {
    const {
      title, description, subject, class_level, emoji,
      html_content, css_content, js_content, duration,
      difficulty, thumbnail, created_by, tags = []
    } = lessonData;

    const result = await query(
      `INSERT INTO lessons (
        title, description, subject, class_level, emoji,
        html_content, css_content, js_content, duration,
        difficulty, thumbnail, created_by, tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        title, description, subject, class_level, emoji,
        html_content, css_content, js_content, duration,
        difficulty, thumbnail, created_by, tags
      ]
    );

    return result.rows[0];
  }

  // Get all lessons with filters
  static async findAll(filters = {}, limit = 10, offset = 0) {
    let queryText = `
      SELECT l.*, u.name as creator_name, u.avatar as creator_avatar,
             COUNT(DISTINCT r.id) as rating_count,
             COUNT(DISTINCT c.id) as comment_count
      FROM lessons l
      LEFT JOIN users u ON l.created_by = u.id
      LEFT JOIN ratings r ON l.id = r.lesson_id
      LEFT JOIN comments c ON l.id = c.lesson_id
      WHERE l.is_published = true
    `;

    const values = [];
    let paramIndex = 1;

    // Add filters
    if (filters.subject) {
      queryText += ` AND l.subject = $${paramIndex}`;
      values.push(filters.subject);
      paramIndex++;
    }

    if (filters.class_level) {
      queryText += ` AND l.class_level = $${paramIndex}`;
      values.push(filters.class_level);
      paramIndex++;
    }

    if (filters.difficulty) {
      queryText += ` AND l.difficulty = $${paramIndex}`;
      values.push(filters.difficulty);
      paramIndex++;
    }

    if (filters.search) {
      queryText += ` AND (l.title ILIKE $${paramIndex} OR l.description ILIKE $${paramIndex})`;
      values.push(`%${filters.search}%`);
      paramIndex++;
    }

    if (filters.created_by) {
      queryText += ` AND l.created_by = $${paramIndex}`;
      values.push(filters.created_by);
      paramIndex++;
    }

    queryText += ` GROUP BY l.id, u.name, u.avatar`;

    // Add sorting
    const sortField = filters.sort || 'created_at';
    const sortOrder = filters.order || 'DESC';
    queryText += ` ORDER BY l.${sortField} ${sortOrder}`;

    // Add pagination
    queryText += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, offset);

    const result = await query(queryText, values);
    
    // Get total count
    const countResult = await query(
      'SELECT COUNT(*) FROM lessons WHERE is_published = true'
    );

    return {
      lessons: result.rows,
      total: parseInt(countResult.rows[0].count)
    };
  }

  // Find lesson by ID
  static async findById(id) {
    const result = await query(
      `SELECT l.*, u.name as creator_name, u.avatar as creator_avatar,
              COALESCE(
                (SELECT json_agg(
                  json_build_object(
                    'id', r.id,
                    'rating', r.rating,
                    'review', r.review,
                    'user', json_build_object('id', ru.id, 'name', ru.name, 'avatar', ru.avatar),
                    'created_at', r.created_at
                  )
                ) FROM ratings r
                JOIN users ru ON r.user_id = ru.id
                WHERE r.lesson_id = l.id
              ), '[]'::json) as ratings,
              COALESCE(
                (SELECT json_agg(
                  json_build_object(
                    'id', c.id,
                    'content', c.content,
                    'user', json_build_object('id', cu.id, 'name', cu.name, 'avatar', cu.avatar),
                    'created_at', c.created_at
                  )
                ) FROM comments c
                JOIN users cu ON c.user_id = cu.id
                WHERE c.lesson_id = l.id
                ORDER BY c.created_at DESC
              ), '[]'::json) as comments
       FROM lessons l
       LEFT JOIN users u ON l.created_by = u.id
       WHERE l.id = $1`,
      [id]
    );

    if (result.rows[0]) {
      // Parse JSON fields
      result.rows[0].ratings = JSON.parse(result.rows[0].ratings);
      result.rows[0].comments = JSON.parse(result.rows[0].comments);
    }

    return result.rows[0];
  }

  // Update lesson
  static async update(id, updates) {
    const allowedUpdates = [
      'title', 'description', 'subject', 'class_level', 'emoji',
      'html_content', 'css_content', 'js_content', 'duration',
      'difficulty', 'thumbnail', 'tags', 'is_published'
    ];

    const setClause = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        setClause.push(`${key} = $${paramIndex}`);
        values.push(updates[key]);
        paramIndex++;
      }
    });

    if (setClause.length === 0) return null;

    values.push(id);
    const result = await query(
      `UPDATE lessons 
       SET ${setClause.join(', ')} 
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    return result.rows[0];
  }

  // Delete lesson
  static async delete(id) {
    const result = await query(
      'DELETE FROM lessons WHERE id = $1 RETURNING id',
      [id]
    );
    
    return result.rows[0];
  }

  // Increment view count
  static async incrementViews(id) {
    const result = await query(
      'UPDATE lessons SET views = views + 1 WHERE id = $1 RETURNING views',
      [id]
    );
    
    return result.rows[0].views;
  }

  // Increment download count
  static async incrementDownloads(id) {
    const result = await query(
      'UPDATE lessons SET downloads = downloads + 1 WHERE id = $1 RETURNING downloads',
      [id]
    );
    
    return result.rows[0].downloads;
  }

  // Get lessons by user (creator)
  static async findByUser(userId) {
    const result = await query(
      'SELECT * FROM lessons WHERE created_by = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    return result.rows;
  }

  // Get popular lessons
  static async getPopular(limit = 10) {
    const result = await query(
      `SELECT l.*, u.name as creator_name,
              COUNT(DISTINCT ul.user_id) as student_count
       FROM lessons l
       LEFT JOIN users u ON l.created_by = u.id
       LEFT JOIN user_lessons ul ON l.id = ul.lesson_id
       WHERE l.is_published = true
       GROUP BY l.id, u.name
       ORDER BY (l.views * 0.3 + l.downloads * 0.3 + l.rating * 0.4) DESC
       LIMIT $1`,
      [limit]
    );
    
    return result.rows;
  }
}

module.exports = Lesson;