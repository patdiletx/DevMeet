import pool from '../config/database';

export interface DailySummary {
  id: number;
  user_id: number;
  project_id?: number;
  summary_date: Date;
  yesterday_work: string[];
  today_plan: string[];
  blockers: string[];
  standup_script: string;
  git_commits: GitCommit[];
  meetings_summary?: string;
  raw_data: any;
  created_at: Date;
  updated_at: Date;
}

export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: string;
  files?: string[];
}

export interface CreateDailySummaryInput {
  user_id?: number;
  project_id?: number;
  summary_date: Date;
  yesterday_work: string[];
  today_plan: string[];
  blockers: string[];
  standup_script: string;
  git_commits: GitCommit[];
  meetings_summary?: string;
  raw_data?: any;
}

export class DailySummaryModel {
  /**
   * Create a new daily summary
   */
  static async create(input: CreateDailySummaryInput): Promise<DailySummary> {
    // Check if a summary already exists
    const existing = await this.findByDate(input.summary_date, input.user_id || 1, input.project_id);

    if (existing) {
      // Update existing
      const sql = `
        UPDATE daily_summaries
        SET yesterday_work = $1,
            today_plan = $2,
            blockers = $3,
            standup_script = $4,
            git_commits = $5,
            meetings_summary = $6,
            raw_data = $7,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $8
        RETURNING *
      `;

      const result = await pool.query(sql, [
        JSON.stringify(input.yesterday_work),
        JSON.stringify(input.today_plan),
        JSON.stringify(input.blockers),
        input.standup_script,
        JSON.stringify(input.git_commits),
        input.meetings_summary || null,
        JSON.stringify(input.raw_data || {}),
        existing.id,
      ]);

      return result.rows[0];
    } else {
      // Insert new
      const sql = `
        INSERT INTO daily_summaries (
          user_id, project_id, summary_date, yesterday_work, today_plan, blockers,
          standup_script, git_commits, meetings_summary, raw_data
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const result = await pool.query(sql, [
        input.user_id || 1,
        input.project_id || null,
        input.summary_date,
        JSON.stringify(input.yesterday_work),
        JSON.stringify(input.today_plan),
        JSON.stringify(input.blockers),
        input.standup_script,
        JSON.stringify(input.git_commits),
        input.meetings_summary || null,
        JSON.stringify(input.raw_data || {}),
      ]);

      return result.rows[0];
    }
  }

  /**
   * Find summary by date
   */
  static async findByDate(date: Date, userId: number = 1, projectId?: number): Promise<DailySummary | null> {
    let sql = `
      SELECT * FROM daily_summaries
      WHERE user_id = $1 AND summary_date = $2
    `;
    const params: any[] = [userId, date];

    if (projectId !== undefined) {
      sql += ' AND project_id = $3';
      params.push(projectId);
    } else {
      sql += ' AND project_id IS NULL';
    }

    const result = await pool.query(sql, params);
    return result.rows[0] || null;
  }

  /**
   * Find recent summaries
   */
  static async findRecent(limit: number = 7, userId: number = 1, projectId?: number): Promise<DailySummary[]> {
    let sql = `
      SELECT * FROM daily_summaries
      WHERE user_id = $1
    `;
    const params: any[] = [userId];

    if (projectId !== undefined) {
      sql += ' AND project_id = $2';
      params.push(projectId);
      sql += ' ORDER BY summary_date DESC LIMIT $3';
      params.push(limit);
    } else {
      sql += ' AND project_id IS NULL';
      sql += ' ORDER BY summary_date DESC LIMIT $2';
      params.push(limit);
    }

    const result = await pool.query(sql, params);
    return result.rows;
  }

  /**
   * Delete summary by date
   */
  static async deleteByDate(date: Date, userId: number = 1): Promise<boolean> {
    const sql = 'DELETE FROM daily_summaries WHERE user_id = $1 AND summary_date = $2';
    const result = await pool.query(sql, [userId, date]);
    return (result.rowCount ?? 0) > 0;
  }
}
