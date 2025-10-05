import { query } from '../config/database';

export interface Project {
  id: number;
  name: string;
  description?: string;
  color?: string;
  status: string;
  git_path?: string;
  git_branch?: string;
  metadata?: any;
  created_at: Date;
  updated_at: Date;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  color?: string;
  git_path?: string;
  git_branch?: string;
  metadata?: any;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  color?: string;
  status?: string;
  git_path?: string;
  git_branch?: string;
  metadata?: any;
}

export class ProjectModel {
  /**
   * Find project by ID
   */
  static async findById(id: number): Promise<Project | null> {
    const result = await query('SELECT * FROM projects WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  /**
   * Find all projects
   */
  static async findAll(options?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<Project[]> {
    let sql = 'SELECT * FROM projects';
    const params: any[] = [];

    if (options?.status) {
      sql += ' WHERE status = $1';
      params.push(options.status);
    }

    sql += ' ORDER BY name ASC';

    if (options?.limit) {
      sql += ` LIMIT $${params.length + 1}`;
      params.push(options.limit);
    }

    if (options?.offset) {
      sql += ` OFFSET $${params.length + 1}`;
      params.push(options.offset);
    }

    const result = await query(sql, params);
    return result.rows;
  }

  /**
   * Count total projects
   */
  static async count(status?: string): Promise<number> {
    let sql = 'SELECT COUNT(*) FROM projects';
    const params: any[] = [];

    if (status) {
      sql += ' WHERE status = $1';
      params.push(status);
    }

    const result = await query(sql, params);
    return parseInt(result.rows[0].count);
  }

  /**
   * Create a new project
   */
  static async create(input: CreateProjectInput): Promise<Project> {
    const sql = `
      INSERT INTO projects (name, description, color, git_path, git_branch, metadata)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const params = [
      input.name,
      input.description || null,
      input.color || null,
      input.git_path || null,
      input.git_branch || null,
      input.metadata || {}
    ];

    const result = await query(sql, params);
    return result.rows[0];
  }

  /**
   * Update an existing project
   */
  static async update(id: number, input: UpdateProjectInput): Promise<Project | null> {
    const fields: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (input.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      params.push(input.name);
    }

    if (input.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      params.push(input.description);
    }

    if (input.color !== undefined) {
      fields.push(`color = $${paramCount++}`);
      params.push(input.color);
    }

    if (input.status !== undefined) {
      fields.push(`status = $${paramCount++}`);
      params.push(input.status);
    }

    if (input.git_path !== undefined) {
      fields.push(`git_path = $${paramCount++}`);
      params.push(input.git_path);
    }

    if (input.git_branch !== undefined) {
      fields.push(`git_branch = $${paramCount++}`);
      params.push(input.git_branch);
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
      UPDATE projects
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await query(sql, params);
    return result.rows[0] || null;
  }

  /**
   * Delete a project
   */
  static async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM projects WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Get project with meeting count
   */
  static async findByIdWithMeetingCount(id: number): Promise<any | null> {
    const sql = `
      SELECT
        p.*,
        COUNT(m.id) AS meeting_count
      FROM projects p
      LEFT JOIN meetings m ON p.id = m.project_id
      WHERE p.id = $1
      GROUP BY p.id
    `;

    const result = await query(sql, [id]);
    return result.rows[0] || null;
  }

  /**
   * Get all projects with meeting counts
   */
  static async findAllWithMeetingCounts(): Promise<any[]> {
    const sql = `
      SELECT
        p.*,
        COUNT(m.id) AS meeting_count
      FROM projects p
      LEFT JOIN meetings m ON p.id = m.project_id
      GROUP BY p.id
      ORDER BY p.name ASC
    `;

    const result = await query(sql);
    return result.rows;
  }
}
