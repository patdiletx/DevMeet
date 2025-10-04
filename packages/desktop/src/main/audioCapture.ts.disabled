import { EventEmitter } from 'events';
import { desktopCapturer, systemPreferences } from 'electron';

/**
 * Audio capture configuration
 */
export interface AudioCaptureConfig {
  sampleRate?: number;
  channelCount?: number;
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
}

/**
 * Audio capture service for Electron desktop app
 * Captures system audio using Web Audio API
 */
export class AudioCaptureService extends EventEmitter {
  private mediaRecorder: MediaRecorder | null = null;
  private audioStream: MediaStream | null = null;
  private isRecording = false;
  private audioChunks: Blob[] = [];
  private config: Required<AudioCaptureConfig>;
  private sequence = 0;

  constructor(config: AudioCaptureConfig = {}) {
    super();
    this.config = {
      sampleRate: config.sampleRate ?? 48000,
      channelCount: config.channelCount ?? 1,
      echoCancellation: config.echoCancellation ?? true,
      noiseSuppression: config.noiseSuppression ?? true,
      autoGainControl: config.autoGainControl ?? true,
    };
  }

  /**
   * Request microphone permissions (macOS)
   */
  async requestPermissions(): Promise<boolean> {
    try {
      if (process.platform === 'darwin') {
        const status = await systemPreferences.getMediaAccessStatus('microphone');

        if (status !== 'granted') {
          const granted = await systemPreferences.askForMediaAccess('microphone');
          return granted;
        }

        return true;
      }

      // Windows and Linux don't require explicit permission requests
      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Get available audio sources
   */
  async getAudioSources(): Promise<Electron.DesktopCapturerSource[]> {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['window', 'screen'],
        fetchWindowIcons: false,
      });

      return sources;
    } catch (error) {
      console.error('Error getting audio sources:', error);
      return [];
    }
  }

  /**
   * Start audio capture from microphone
   */
  async startMicrophoneCapture(): Promise<void> {
    if (this.isRecording) {
      throw new Error('Already recording');
    }

    try {
      // Request permissions first
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Microphone permission denied');
      }

      // Get user media (microphone)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.config.sampleRate,
          channelCount: this.config.channelCount,
          echoCancellation: this.config.echoCancellation,
          noiseSuppression: this.config.noiseSuppression,
          autoGainControl: this.config.autoGainControl,
        },
        video: false,
      });

      await this.startRecording(stream);
    } catch (error) {
      console.error('Error starting microphone capture:', error);
      throw error;
    }
  }

  /**
   * Start audio capture from system audio (requires screen/window capture)
   */
  async startSystemAudioCapture(): Promise<void> {
    if (this.isRecording) {
      throw new Error('Already recording');
    }

    try {
      // Get available sources
      const sources = await this.getAudioSources();

      if (sources.length === 0) {
        throw new Error('No audio sources available');
      }

      // Use the first screen source (entire screen)
      const screenSource = sources.find(source => source.id.startsWith('screen:'));

      if (!screenSource) {
        throw new Error('No screen source available for system audio');
      }

      // Capture system audio via screen capture with audio
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: screenSource.id,
          },
        } as any,
        video: false,
      } as any);

      await this.startRecording(stream);
    } catch (error) {
      console.error('Error starting system audio capture:', error);
      throw error;
    }
  }

  /**
   * Start recording with given stream
   */
  private async startRecording(stream: MediaStream): Promise<void> {
    this.audioStream = stream;
    this.audioChunks = [];
    this.sequence = 0;

    // Create MediaRecorder with appropriate mime type
    const mimeType = this.getSupportedMimeType();
    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      audioBitsPerSecond: 128000, // 128kbps
    });

    // Handle data available (chunks)
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
        this.sequence++;

        // Emit chunk event
        this.emit('audio-chunk', {
          chunk: event.data,
          sequence: this.sequence,
          timestamp: Date.now(),
        });
      }
    };

    // Handle recording stop
    this.mediaRecorder.onstop = () => {
      this.emit('recording-stopped', {
        chunks: this.audioChunks,
        duration: this.calculateDuration(),
      });
    };

    // Handle errors
    this.mediaRecorder.onerror = (error) => {
      console.error('MediaRecorder error:', error);
      this.emit('error', error);
    };

    // Start recording with timeslice for real-time chunks
    // Request data every 1 second
    this.mediaRecorder.start(1000);
    this.isRecording = true;

    this.emit('recording-started', {
      sampleRate: this.config.sampleRate,
      channelCount: this.config.channelCount,
      mimeType,
    });
  }

  /**
   * Stop audio capture
   */
  async stopCapture(): Promise<Blob | null> {
    if (!this.isRecording || !this.mediaRecorder) {
      return null;
    }

    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        // Create final blob from all chunks
        const blob = new Blob(this.audioChunks, {
          type: this.mediaRecorder?.mimeType || 'audio/webm',
        });

        // Stop all tracks
        this.audioStream?.getTracks().forEach(track => track.stop());
        this.audioStream = null;
        this.mediaRecorder = null;
        this.isRecording = false;

        this.emit('recording-stopped', {
          blob,
          duration: this.calculateDuration(),
        });

        resolve(blob);
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Pause recording
   */
  pauseCapture(): void {
    if (this.isRecording && this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.pause();
      this.emit('recording-paused');
    }
  }

  /**
   * Resume recording
   */
  resumeCapture(): void {
    if (this.isRecording && this.mediaRecorder?.state === 'paused') {
      this.mediaRecorder.resume();
      this.emit('recording-resumed');
    }
  }

  /**
   * Get supported mime type for recording
   */
  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/mp4',
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'audio/webm'; // Fallback
  }

  /**
   * Calculate recording duration
   */
  private calculateDuration(): number {
    // This is approximate - in production, you'd track actual timestamps
    return this.audioChunks.length; // seconds (with 1s timeslice)
  }

  /**
   * Check if currently recording
   */
  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Get current sequence number
   */
  getCurrentSequence(): number {
    return this.sequence;
  }
}
