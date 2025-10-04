import pool from '../config/database';

export interface ProjectChatMessage {
  id: number;
  project_id: number;
  role: 'user' | 'assistant';
  content: string;
  context?: string | null;
  created_at: Date;
}

export interface CreateProjectChatMessageInput {
  project_id: number;
  role: 'user' | 'assistant';
  content: string;
  context?: string | null;
}

export class ProjectChatMessageModel {
  /**
   * Create a new project chat message
   */
  static async create(input: CreateProjectChatMessageInput): Promise<ProjectChatMessage> {
    const sql = `
      INSERT INTO project_chat_messages (project_id, role, content, context)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await pool.query(sql, [
      input.project_id,
      input.role,
      input.content,
      input.context || null,
    ]);

    return result.rows[0];
  }

  /**
   * Find all messages for a project
   */
  static async findByProjectId(projectId: number): Promise<ProjectChatMessage[]> {
    const sql = `
      SELECT *
      FROM project_chat_messages
      WHERE project_id = $1
      ORDER BY created_at ASC
    `;

    const result = await pool.query(sql, [projectId]);
    return result.rows;
  }

  /**
   * Delete all messages for a project
   */
  static async deleteByProjectId(projectId: number): Promise<number> {
    const sql = 'DELETE FROM project_chat_messages WHERE project_id = $1';
    const result = await pool.query(sql, [projectId]);
    return result.rowCount || 0;
  }

  /**
   * Get message count for a project
   */
  static async countByProjectId(projectId: number): Promise<number> {
    const sql = 'SELECT COUNT(*) FROM project_chat_messages WHERE project_id = $1';
    const result = await pool.query(sql, [projectId]);
    return parseInt(result.rows[0].count);
  }
}
