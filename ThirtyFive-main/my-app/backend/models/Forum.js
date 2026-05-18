const { query } = require('../config/database');

class Forum {
    static async getCategories() {
        const result = await query(`
            SELECT c.*, COUNT(t.id) as topics_count
            FROM forum_categories c
            LEFT JOIN forum_topics t ON c.id = t.category_id
            GROUP BY c.id
            ORDER BY c.name
        `);
        return result.rows;
    }

    static async getTopics(categoryId, page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        const result = await query(`
            SELECT t.*, u.name as author_name, u.avatar as author_avatar,
                   COUNT(p.id) as replies_count,
                   COALESCE(MAX(p.created_at), t.created_at) as last_activity
            FROM forum_topics t
            JOIN users u ON t.user_id = u.id
            LEFT JOIN forum_posts p ON t.id = p.topic_id
            WHERE t.category_id = $1
            GROUP BY t.id, u.name, u.avatar
            ORDER BY t.is_pinned DESC, last_activity DESC
            LIMIT $2 OFFSET $3
        `, [categoryId, limit, offset]);
        
        const countResult = await query(
            'SELECT COUNT(*) FROM forum_topics WHERE category_id = $1',
            [categoryId]
        );
        
        return {
            topics: result.rows,
            total: parseInt(countResult.rows[0].count)
        };
    }

    static async getTopic(topicId) {
        const result = await query(`
            SELECT t.*, u.name as author_name, u.avatar as author_avatar,
                   c.name as category_name
            FROM forum_topics t
            JOIN users u ON t.user_id = u.id
            JOIN forum_categories c ON t.category_id = c.id
            WHERE t.id = $1
        `, [topicId]);
        
        if (result.rows[0]) {
            await query('UPDATE forum_topics SET views = views + 1 WHERE id = $1', [topicId]);
        }
        
        return result.rows[0];
    }

    static async getPosts(topicId, page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        const result = await query(`
            SELECT p.*, u.name as author_name, u.avatar as author_avatar, u.role
            FROM forum_posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.topic_id = $1
            ORDER BY p.created_at ASC
            LIMIT $2 OFFSET $3
        `, [topicId, limit, offset]);
        
        return result.rows;
    }

    static async createTopic(categoryId, userId, title, content) {
        const client = await this.getClient();
        try {
            await client.query('BEGIN');
            
            const topicResult = await client.query(`
                INSERT INTO forum_topics (category_id, user_id, title)
                VALUES ($1, $2, $3)
                RETURNING *
            `, [categoryId, userId, title]);
            
            const postResult = await client.query(`
                INSERT INTO forum_posts (topic_id, user_id, content)
                VALUES ($1, $2, $3)
                RETURNING *
            `, [topicResult.rows[0].id, userId, content]);
            
            await client.query('COMMIT');
            return { topic: topicResult.rows[0], post: postResult.rows[0] };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
    }

    static async createPost(topicId, userId, content) {
        const result = await query(`
            INSERT INTO forum_posts (topic_id, user_id, content)
            VALUES ($1, $2, $3)
            RETURNING *
        `, [topicId, userId, content]);
        
        await query(`
            UPDATE forum_topics SET updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
        `, [topicId]);
        
        return result.rows[0];
    }

    static async togglePin(topicId) {
        const result = await query(`
            UPDATE forum_topics SET is_pinned = NOT is_pinned
            WHERE id = $1
            RETURNING is_pinned
        `, [topicId]);
        return result.rows[0].is_pinned;
    }

    static async toggleLock(topicId) {
        const result = await query(`
            UPDATE forum_topics SET is_locked = NOT is_locked
            WHERE id = $1
            RETURNING is_locked
        `, [topicId]);
        return result.rows[0].is_locked;
    }

    static getClient() {
        return require('../config/database').pool.connect();
    }
}

module.exports = Forum;