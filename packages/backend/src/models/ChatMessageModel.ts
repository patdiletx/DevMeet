import { Pool } from 'pg';

export interface ChatMessage {
  id: number;
  meeting_id: number;
  role: 'user' | 'assistant';
  content: string;
  context: string | null;
  metadata: Record<string, any>;
  created_at: Date;
}

export class ChatMessageModel {
  constructor(private pool: Pool) {}

  async create(data: {
    meeting_id: number;
    role: 'user' | 'assistant';
    content: string;
    context?: string;
    metadata?: Record<string, any>;
  }): Promise<ChatMessage> {
    const query = `
      INSERT INTO chat_messages (meeting_id, role, content, context, metadata)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      data.meeting_id,
      data.role,
      data.content,
      data.context || null,
      data.metadata || {},
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async findByMeetingId(meetingId: number): Promise<ChatMessage[]> {
    const query = `
      SELECT * FROM chat_messages
      WHERE meeting_id = $1
      ORDER BY created_at ASC
    `;

    const result = await this.pool.query(query, [meetingId]);
    return result.rows;
  }

  async deleteByMeetingId(meetingId: number): Promise<void> {
    await this.pool.query('DELETE FROM chat_messages WHERE meeting_id = $1', [meetingId]);
  }
}
