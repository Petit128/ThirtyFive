const { query } = require('../config/database');

class Grade {
    static async addGrade(gradeData) {
        const { userId, lessonId, quizId, grade, maxGrade, weight, comment, gradedBy } = gradeData;
        
        const result = await query(`
            INSERT INTO grades (user_id, lesson_id, quiz_id, grade, max_grade, weight, comment, graded_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (user_id, lesson_id, quiz_id) 
            DO UPDATE SET grade = $4, comment = $7, graded_at = CURRENT_TIMESTAMP
            RETURNING *
        `, [userId, lessonId, quizId, grade, maxGrade, weight, comment, gradedBy]);
        
        return result.rows[0];
    }

    static async getUserGrades(userId) {
        const result = await query(`
            SELECT g.*, l.title as lesson_title, q.title as quiz_title,
                   u.name as teacher_name
            FROM grades g
            LEFT JOIN lessons l ON g.lesson_id = l.id
            LEFT JOIN quizzes q ON g.quiz_id = q.id
            LEFT JOIN users u ON g.graded_by = u.id
            WHERE g.user_id = $1
            ORDER BY g.graded_at DESC
        `, [userId]);
        return result.rows;
    }

    static async getStudentReportCard(userId, semester = null) {
        // Obtenir toutes les notes par matière
        const result = await query(`
            SELECT 
                COALESCE(l.subject, 'Quiz') as subject,
                AVG(g.grade) as average_grade,
                COUNT(*) as assignments_count,
                MIN(g.grade) as min_grade,
                MAX(g.grade) as max_grade
            FROM grades g
            LEFT JOIN lessons l ON g.lesson_id = l.id
            WHERE g.user_id = $1
            GROUP BY l.subject
            ORDER BY subject
        `, [userId]);
        
        // Calculer la moyenne générale
        const overall = await query(`
            SELECT 
                AVG(g.grade) as overall_average,
                SUM(CASE WHEN g.grade >= 50 THEN 1 ELSE 0 END) as passed_count,
                COUNT(*) as total_count
            FROM grades g
            WHERE g.user_id = $1
        `, [userId]);
        
        return {
            subjects: result.rows,
            overall: overall.rows[0],
            generated_at: new Date().toISOString()
        };
    }

    static async generateReportCard(userId) {
        const reportData = await this.getStudentReportCard(userId);
        
        const result = await query(`
            INSERT INTO grade_reports (user_id, report_data)
            VALUES ($1, $2)
            RETURNING *
        `, [userId, JSON.stringify(reportData)]);
        
        return result.rows[0];
    }

    static async getClassGrades(classId, subject = null) {
        let queryText = `
            SELECT u.id, u.name, u.email,
                   AVG(g.grade) as average_grade,
                   COUNT(g.id) as assignments_count
            FROM users u
            LEFT JOIN grades g ON u.id = g.user_id
            WHERE u.class_name = $1
        `;
        
        const values = [classId];
        
        if (subject) {
            queryText += ` AND EXISTS (
                SELECT 1 FROM lessons l 
                WHERE l.id = g.lesson_id AND l.subject = $2
            )`;
            values.push(subject);
        }
        
        queryText += ` GROUP BY u.id, u.name, u.email ORDER BY average_grade DESC`;
        
        const result = await query(queryText, values);
        return result.rows;
    }
}

module.exports = Grade;