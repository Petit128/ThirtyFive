const { query } = require('../config/database');
const fs = require('fs');
const path = require('path');

class UploadedFile {
    static async save(fileData) {
        const { filename, originalName, filePath, fileSize, mimeType, userId, lessonId, isPublic } = fileData;
        
        const result = await query(`
            INSERT INTO uploaded_files (filename, original_name, file_path, file_size, mime_type, user_id, lesson_id, is_public)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `, [filename, originalName, filePath, fileSize, mimeType, userId, lessonId, isPublic]);
        
        return result.rows[0];
    }

    static async getFiles(lessonId = null, userId = null) {
        let queryText = `
            SELECT f.*, u.name as uploader_name
            FROM uploaded_files f
            LEFT JOIN users u ON f.user_id = u.id
            WHERE 1=1
        `;
        const values = [];
        
        if (lessonId) {
            queryText += ` AND f.lesson_id = $${values.length + 1}`;
            values.push(lessonId);
        }
        
        if (userId) {
            queryText += ` AND f.user_id = $${values.length + 1}`;
            values.push(userId);
        }
        
        queryText += ` ORDER BY f.created_at DESC`;
        
        const result = await query(queryText, values);
        return result.rows;
    }

    static async getFile(id) {
        const result = await query('SELECT * FROM uploaded_files WHERE id = $1', [id]);
        return result.rows[0];
    }

    static async deleteFile(id, userId, isAdmin = false) {
        const file = await this.getFile(id);
        if (!file) return null;
        
        if (!isAdmin && file.user_id !== userId) {
            throw new Error('Unauthorized');
        }
        
        // Supprimer le fichier physique
        if (fs.existsSync(file.file_path)) {
            fs.unlinkSync(file.file_path);
        }
        
        const result = await query('DELETE FROM uploaded_files WHERE id = $1 RETURNING id', [id]);
        return result.rows[0];
    }
}

module.exports = UploadedFile;