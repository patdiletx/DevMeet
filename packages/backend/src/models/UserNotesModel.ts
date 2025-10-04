import { Pool } from 'pg';

export interface UserNotes {
  id: number;
  meeting_id: number;
  content: string;
  created_at: Date;
  updated_at: Date;
}

export class UserNotesModel {
  constructor(private pool: Pool) {}

  async upsert(meetingId: number, content: string): Promise<UserNotes> {
    const query = `
      INSERT INTO user_notes (meeting_id, content)
      VALUES ($1, $2)
      ON CONFLICT (meeting_id)
      DO UPDATE SET content = $2, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const result = await this.pool.query(query, [meetingId, content]);
    return result.rows[0];
  }

  async findByMeetingId(meetingId: number): Promise<UserNotes | null> {
    const query = 'SELECT * FROM user_notes WHERE meeting_id = $1';
    const result = await this.pool.query(query, [meetingId]);
    return result.rows[0] || null;
  }

  async delete(meetingId: number): Promise<void> {
    await this.pool.query('DELETE FROM user_notes WHERE meeting_id = $1', [meetingId]);
  }
}
