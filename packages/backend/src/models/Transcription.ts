import { query } from '../config/database';
import type { Transcription, CreateTranscriptionInput } from '../types';

export class TranscriptionModel {
  /**
   * Find transcription by ID
   */
  static async findById(id: number): Promise<Transcription | null> {
    const result = await query('SELECT * FROM transcriptions WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  /**
   * Find all transcriptions for a meeting
   */
  static async findByMeetingId(
    meetingId: number,
    options?: { limit?: number; offset?: number }
  ): Promise<Transcription[]> {
    let sql = 'SELECT * FROM transcriptions WHERE meeting_id = $1 ORDER BY timestamp ASC';
    const params: any[] = [meetingId];

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
   * Create a new transcription
   */
  static async create(input: CreateTranscriptionInput): Promise<Transcription> {
    const sql = `
      INSERT INTO transcriptions (
        meeting_id,
        content,
        speaker,
        timestamp,
        confidence,
        language,
        duration_seconds,
        audio_offset_ms,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const params = [
      input.meeting_id,
      input.content,
      input.speaker || null,
      input.timestamp,
      input.confidence || null,
      input.language || null,
      input.duration_seconds || null,
      input.audio_offset_ms || null,
      input.metadata || {},
    ];

    const result = await query(sql, params);
    return result.rows[0];
  }

  /**
   * Search transcriptions by text (full-text search)
   */
  static async search(
    searchQuery: string,
    options?: { meetingId?: number; limit?: number }
  ): Promise<Transcription[]> {
    let sql = `
      SELECT t.*, ts_rank(to_tsvector('spanish', t.content), query) AS rank
      FROM transcriptions t,
        plainto_tsquery('spanish', $1) query
      WHERE to_tsvector('spanish', t.content) @@ query
    `;

    const params: any[] = [searchQuery];

    if (options?.meetingId) {
      sql += ` AND t.meeting_id = $${params.length + 1}`;
      params.push(options.meetingId);
    }

    sql += ' ORDER BY rank DESC';

    if (options?.limit) {
      sql += ` LIMIT $${params.length + 1}`;
      params.push(options.limit);
    }

    const result = await query(sql, params);
    return result.rows;
  }

  /**
   * Delete a transcription
   */
  static async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM transcriptions WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Delete all transcriptions for a meeting
   */
  static async deleteByMeetingId(meetingId: number): Promise<number> {
    const result = await query('DELETE FROM transcriptions WHERE meeting_id = $1', [
      meetingId,
    ]);
    return result.rowCount ?? 0;
  }

  /**
   * Get recent transcriptions (for context window)
   */
  static async getRecentByMeetingId(
    meetingId: number,
    limit: number = 10
  ): Promise<Transcription[]> {
    const sql = `
      SELECT * FROM transcriptions
      WHERE meeting_id = $1
      ORDER BY timestamp DESC
      LIMIT $2
    `;

    const result = await query(sql, [meetingId, limit]);
    return result.rows.reverse(); // Return in chronological order
  }
}
