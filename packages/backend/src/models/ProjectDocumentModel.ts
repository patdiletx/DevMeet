import pool from '../config/database';

export interface ProjectDocument {
  id: number;
  project_id: number;
  title: string;
  content: string;
  file_type?: string;
  file_size?: number;
  file_url?: string;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface CreateProjectDocumentInput {
  project_id: number;
  title: string;
  content: string;
  file_type?: string;
  file_size?: number;
  file_url?: string;
  metadata?: Record<string, any>;
}

export interface UpdateProjectDocumentInput {
  title?: string;
  content?: string;
  file_type?: string;
  file_size?: number;
  file_url?: string;
  metadata?: Record<string, any>;
}

export class ProjectDocumentModel {
  /**
   * Find all documents for a project
   */
  static async findByProjectId(projectId: number): Promise<ProjectDocument[]> {
    const result = await pool.query(
      'SELECT * FROM project_documents WHERE project_id = $1 ORDER BY created_at DESC',
      [projectId]
    );
    return result.rows;
  }

  /**
   * Find document by ID
   */
  static async findById(id: number): Promise<ProjectDocument | null> {
    const result = await pool.query(
      'SELECT * FROM project_documents WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Create a new document
   */
  static async create(input: CreateProjectDocumentInput): Promise<ProjectDocument> {
    const sql = `
      INSERT INTO project_documents (
        project_id, title, content, file_type, file_size, file_url, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const params = [
      input.project_id,
      input.title,
      input.content,
      input.file_type || null,
      input.file_size || null,
      input.file_url || null,
      input.metadata || {}
    ];

    const result = await pool.query(sql, params);
    return result.rows[0];
  }

  /**
   * Update a document
   */
  static async update(id: number, input: UpdateProjectDocumentInput): Promise<ProjectDocument | null> {
    const fields: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (input.title !== undefined) {
      fields.push(`title = $${paramCount++}`);
      params.push(input.title);
    }

    if (input.content !== undefined) {
      fields.push(`content = $${paramCount++}`);
      params.push(input.content);
    }

    if (input.file_type !== undefined) {
      fields.push(`file_type = $${paramCount++}`);
      params.push(input.file_type);
    }

    if (input.file_size !== undefined) {
      fields.push(`file_size = $${paramCount++}`);
      params.push(input.file_size);
    }

    if (input.file_url !== undefined) {
      fields.push(`file_url = $${paramCount++}`);
      params.push(input.file_url);
    }

    if (input.metadata !== undefined) {
      fields.push(`metadata = $${paramCount++}`);
      params.push(input.metadata);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    params.push(id);

    const sql = `
      UPDATE project_documents
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(sql, params);
    return result.rows[0] || null;
  }

  /**
   * Delete a document
   */
  static async delete(id: number): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM project_documents WHERE id = $1',
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Search documents by text
   */
  static async search(projectId: number, query: string): Promise<ProjectDocument[]> {
    const sql = `
      SELECT *,
        ts_rank(to_tsvector('english', content), plainto_tsquery('english', $1)) AS rank
      FROM project_documents
      WHERE project_id = $2
        AND to_tsvector('english', content) @@ plainto_tsquery('english', $1)
      ORDER BY rank DESC, created_at DESC
      LIMIT 20
    `;

    const result = await pool.query(sql, [query, projectId]);
    return result.rows;
  }

  /**
   * Get all documents content concatenated for AI context
   */
  static async getDocumentsContextForProject(projectId: number): Promise<string> {
    const documents = await this.findByProjectId(projectId);

    if (documents.length === 0) {
      return '';
    }

    const context = documents
      .map(doc => `=== ${doc.title} ===\n${doc.content}`)
      .join('\n\n');

    return context;
  }
}
