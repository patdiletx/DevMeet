import { Pool } from 'pg';

export interface MeetingAnalysis {
  id: number;
  meeting_id: number;
  summary: string | null;
  key_points: string[];
  action_items: string[];
  decisions: string[];
  topics: string[];
  participants: string[];
  sentiment: string | null;
  user_notes: string | null;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export class MeetingAnalysisModel {
  constructor(private pool: Pool) {}

  async create(data: {
    meeting_id: number;
    summary?: string;
    key_points?: string[];
    action_items?: string[];
    decisions?: string[];
    topics?: string[];
    participants?: string[];
    sentiment?: string;
    user_notes?: string;
  }): Promise<MeetingAnalysis> {
    const query = `
      INSERT INTO meeting_analysis (
        meeting_id, summary, key_points, action_items, decisions,
        topics, participants, sentiment, user_notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      data.meeting_id,
      data.summary || null,
      data.key_points || [],
      data.action_items || [],
      data.decisions || [],
      data.topics || [],
      data.participants || [],
      data.sentiment || null,
      data.user_notes || null,
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async update(meetingId: number, data: Partial<MeetingAnalysis>): Promise<MeetingAnalysis> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.summary !== undefined) {
      fields.push(`summary = $${paramCount++}`);
      values.push(data.summary);
    }
    if (data.key_points !== undefined) {
      fields.push(`key_points = $${paramCount++}`);
      values.push(data.key_points);
    }
    if (data.action_items !== undefined) {
      fields.push(`action_items = $${paramCount++}`);
      values.push(data.action_items);
    }
    if (data.decisions !== undefined) {
      fields.push(`decisions = $${paramCount++}`);
      values.push(data.decisions);
    }
    if (data.topics !== undefined) {
      fields.push(`topics = $${paramCount++}`);
      values.push(data.topics);
    }
    if (data.participants !== undefined) {
      fields.push(`participants = $${paramCount++}`);
      values.push(data.participants);
    }
    if (data.sentiment !== undefined) {
      fields.push(`sentiment = $${paramCount++}`);
      values.push(data.sentiment);
    }
    if (data.user_notes !== undefined) {
      fields.push(`user_notes = $${paramCount++}`);
      values.push(data.user_notes);
    }

    values.push(meetingId);

    const query = `
      UPDATE meeting_analysis
      SET ${fields.join(', ')}
      WHERE meeting_id = $${paramCount}
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async findByMeetingId(meetingId: number): Promise<MeetingAnalysis | null> {
    const query = 'SELECT * FROM meeting_analysis WHERE meeting_id = $1';
    const result = await this.pool.query(query, [meetingId]);
    return result.rows[0] || null;
  }

  async upsert(data: {
    meeting_id: number;
    summary?: string;
    key_points?: string[];
    action_items?: string[];
    decisions?: string[];
    topics?: string[];
    participants?: string[];
    sentiment?: string;
    user_notes?: string;
  }): Promise<MeetingAnalysis> {
    const existing = await this.findByMeetingId(data.meeting_id);

    if (existing) {
      return this.update(data.meeting_id, data);
    } else {
      return this.create(data);
    }
  }
}
