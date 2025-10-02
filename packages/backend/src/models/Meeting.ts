import { query } from '../config/database';
import type {
  Meeting,
  CreateMeetingInput,
  UpdateMeetingInput,
  MeetingStatus,
} from '../types';

export class MeetingModel {
  /**
   * Find meeting by ID
   */
  static async findById(id: number): Promise<Meeting | null> {
    const result = await query('SELECT * FROM meetings WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  /**
   * Find all meetings with optional filters
   */
  static async findAll(options?: {
    status?: MeetingStatus;
    limit?: number;
    offset?: number;
  }): Promise<Meeting[]> {
    let sql = 'SELECT * FROM meetings';
    const params: any[] = [];

    if (options?.status) {
      sql += ' WHERE status = $1';
      params.push(options.status);
    }

    sql += ' ORDER BY started_at DESC';

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
   * Count total meetings
   */
  static async count(status?: MeetingStatus): Promise<number> {
    let sql = 'SELECT COUNT(*) FROM meetings';
    const params: any[] = [];

    if (status) {
      sql += ' WHERE status = $1';
      params.push(status);
    }

    const result = await query(sql, params);
    return parseInt(result.rows[0].count);
  }

  /**
   * Create a new meeting
   */
  static async create(input: CreateMeetingInput): Promise<Meeting> {
    const sql = `
      INSERT INTO meetings (title, description, started_at, metadata)
      VALUES ($1, $2, NOW(), $3)
      RETURNING *
    `;

    const params = [input.title, input.description || null, input.metadata || {}];

    const result = await query(sql, params);
    return result.rows[0];
  }

  /**
   * Update an existing meeting
   */
  static async update(id: number, input: UpdateMeetingInput): Promise<Meeting | null> {
    const fields: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (input.title !== undefined) {
      fields.push(`title = $${paramCount++}`);
      params.push(input.title);
    }

    if (input.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      params.push(input.description);
    }

    if (input.ended_at !== undefined) {
      fields.push(`ended_at = $${paramCount++}`);
      params.push(input.ended_at);
    }

    if (input.status !== undefined) {
      fields.push(`status = $${paramCount++}`);
      params.push(input.status);
    }

    if (input.audio_file_path !== undefined) {
      fields.push(`audio_file_path = $${paramCount++}`);
      params.push(input.audio_file_path);
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
      UPDATE meetings
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await query(sql, params);
    return result.rows[0] || null;
  }

  /**
   * Delete a meeting
   */
  static async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM meetings WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Get meeting with all related data
   */
  static async findByIdWithRelations(id: number): Promise<any | null> {
    const sql = `
      SELECT
        m.*,
        COALESCE(json_agg(DISTINCT t.*) FILTER (WHERE t.id IS NOT NULL), '[]') AS transcriptions,
        COALESCE(json_agg(DISTINCT n.*) FILTER (WHERE n.id IS NOT NULL), '[]') AS notes,
        COALESCE(json_agg(DISTINCT a.*) FILTER (WHERE a.id IS NOT NULL), '[]') AS action_items,
        COALESCE(json_agg(DISTINCT p.*) FILTER (WHERE p.id IS NOT NULL), '[]') AS participants
      FROM meetings m
      LEFT JOIN transcriptions t ON m.id = t.meeting_id
      LEFT JOIN notes n ON m.id = n.meeting_id
      LEFT JOIN action_items a ON m.id = a.meeting_id
      LEFT JOIN participants p ON m.id = p.meeting_id
      WHERE m.id = $1
      GROUP BY m.id
    `;

    const result = await query(sql, [id]);
    return result.rows[0] || null;
  }

  /**
   * End a meeting (set ended_at and status to ended)
   */
  static async end(id: number): Promise<Meeting | null> {
    const sql = `
      UPDATE meetings
      SET ended_at = NOW(), status = 'ended'
      WHERE id = $1
      RETURNING *
    `;

    const result = await query(sql, [id]);
    return result.rows[0] || null;
  }
}
