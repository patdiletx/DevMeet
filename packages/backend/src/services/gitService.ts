import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../config/logger';
import type { GitCommit } from '../models/DailySummaryModel';

const execAsync = promisify(exec);

export class GitService {
  private repoPath: string;

  constructor(repoPath: string = process.cwd()) {
    this.repoPath = repoPath;
  }

  /**
   * Get commits from yesterday (or a specific date)
   */
  async getCommitsFromYesterday(authorEmail?: string, pathFilter?: string, branch?: string): Promise<GitCommit[]> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.getCommitsBetweenDates(yesterday, today, authorEmail, pathFilter, branch);
  }

  /**
   * Get commits between two dates
   */
  async getCommitsBetweenDates(
    startDate: Date,
    endDate: Date,
    authorEmail?: string,
    pathFilter?: string,
    branch?: string
  ): Promise<GitCommit[]> {
    try {
      const since = startDate.toISOString().split('T')[0];
      const until = endDate.toISOString().split('T')[0];

      // Build git log command with optional branch
      const branchSpec = branch || 'HEAD';
      let gitCommand = `git log ${branchSpec} --since="${since}" --until="${until}" --pretty=format:"%H|%s|%an|%ai" --no-merges`;

      if (authorEmail) {
        gitCommand += ` --author="${authorEmail}"`;
      }

      // Add path filter if specified (e.g., "packages/backend" or "src/components")
      if (pathFilter) {
        gitCommand += ` -- ${pathFilter}`;
      }

      logger.info(`Executing git command: ${gitCommand}`);

      const { stdout, stderr } = await execAsync(gitCommand, {
        cwd: this.repoPath,
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      });

      if (stderr) {
        logger.warn(`Git stderr: ${stderr}`);
      }

      if (!stdout.trim()) {
        logger.info('No commits found for the specified period');
        return [];
      }

      // Parse git log output
      const commits: GitCommit[] = stdout
        .trim()
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          const [hash, message, author, date] = line.split('|');
          return {
            hash: hash.substring(0, 7), // Short hash
            message: message.trim(),
            author: author.trim(),
            date: date.trim(),
          };
        });

      logger.info(`Found ${commits.length} commits`);

      // Get files changed for each commit (optional, can be slow for many commits)
      if (commits.length > 0 && commits.length <= 20) {
        await this.addFilestoCommits(commits);
      }

      return commits;
    } catch (error: any) {
      logger.error(`Error getting git commits: ${error.message}`);

      // If git command fails, return empty array (might not be a git repo)
      if (error.message.includes('not a git repository')) {
        logger.warn('Not a git repository, returning empty commits array');
        return [];
      }

      throw error;
    }
  }

  /**
   * Add files changed to commits
   */
  private async addFilestoCommits(commits: GitCommit[]): Promise<void> {
    for (const commit of commits) {
      try {
        const { stdout } = await execAsync(`git show --name-only --pretty=format:"" ${commit.hash}`, {
          cwd: this.repoPath,
        });

        commit.files = stdout
          .trim()
          .split('\n')
          .filter(file => file.trim());
      } catch (error) {
        logger.error(`Error getting files for commit ${commit.hash}:`, error);
        commit.files = [];
      }
    }
  }

  /**
   * Get current user's git email
   */
  async getCurrentUserEmail(): Promise<string | undefined> {
    try {
      const { stdout } = await execAsync('git config user.email', {
        cwd: this.repoPath,
      });
      return stdout.trim();
    } catch (error) {
      logger.warn('Could not get git user email');
      return undefined;
    }
  }

  /**
   * Check if current directory is a git repository
   */
  async isGitRepository(): Promise<boolean> {
    try {
      await execAsync('git rev-parse --git-dir', {
        cwd: this.repoPath,
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const gitService = new GitService();
