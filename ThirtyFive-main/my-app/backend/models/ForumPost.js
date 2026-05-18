// backend/models/ForumPost.js
const { query } = require('../config/database');

class ForumPost {
  static async create(topicId, userId, content) {
    const result = await query(
      `INSERT INTO forum_posts (topic_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [topicId, userId, content]
    );
    return result.rows[0];
  }

  static async update(postId, userId, content) {
    const result = await query(
      `UPDATE forum_posts 
       SET content = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [content, postId, userId]
    );
    return result.rows[0];
  }

  static async delete(postId, userId, isAdmin = false) {
    let queryText = 'DELETE FROM forum_posts WHERE id = $1';
    const values = [postId];
    
    if (!isAdmin) {
      queryText += ' AND user_id = $2';
      values.push(userId);
    }
    
    queryText += ' RETURNING id';
    
    const result = await query(queryText, values);
    return result.rows[0];
  }

  static async like(postId, userId) {
    const result = await query(
      `UPDATE forum_posts 
       SET likes = likes + 1
       WHERE id = $1
       RETURNING likes`,
      [postId]
    );
    return result.rows[0]?.likes || 0;
  }

  static async markAsAnswer(postId, topicId) {
    await query(
      `UPDATE forum_posts 
       SET is_answer = false
       WHERE topic_id = $1`,
      [topicId]
    );
    
    const result = await query(
      `UPDATE forum_posts 
       SET is_answer = true
       WHERE id = $1
       RETURNING *`,
      [postId]
    );
    return result.rows[0];
  }
}

module.exports = ForumPost;