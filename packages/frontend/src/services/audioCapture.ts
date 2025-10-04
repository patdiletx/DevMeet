/**
 * Audio Capture Service
 * Handles microphone and system audio capture in the browser/renderer process
 */

export interface AudioCaptureConfig {
  sampleRate?: number;
  channelCount?: number;
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
}

export class AudioCaptureService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioStream: MediaStream | null = null;
  private isRecording = false;
  private sequence = 0;
  private config: Required<AudioCaptureConfig>;
  private onAudioChunk?: (chunk: Blob, sequence: number) => void;
  private onError?: (error: Error) => void;

  constructor(config: AudioCaptureConfig = {}) {
    this.config = {
      sampleRate: config.sampleRate ?? 48000,
      channelCount: config.channelCount ?? 1,
      echoCancellation: config.echoCancellation ?? true,
      noiseSuppression: config.noiseSuppression ?? true,
      autoGainControl: config.autoGainControl ?? true,
    };
  }

  /**
   * Set callback for audio chunks
   */
  onChunk(callback: (chunk: Blob, sequence: number) => void) {
    this.onAudioChunk = callback;
  }

  /**
   * Set callback for errors
   */
  onErrorCallback(callback: (error: Error) => void) {
    this.onError = callback;
  }

  /**
   * Start capturing microphone audio
   */
  async startMicrophoneCapture(): Promise<void> {
    if (this.isRecording) {
      throw new Error('Already recording');
    }

    try {
      // Get microphone stream
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.config.sampleRate,
          channelCount: this.config.channelCount,
          echoCancellation: this.config.echoCancellation,
          noiseSuppression: this.config.noiseSuppression,
          autoGainControl: this.config.autoGainControl,
        },
        video: false,
      });

      await this.startRecording();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to start microphone capture');
      this.handleError(err);
      throw err;
    }
  }

  /**
   * Start capturing system audio (screen/window audio)
   */
  async startSystemAudioCapture(): Promise<void> {
    if (this.isRecording) {
      throw new Error('Already recording');
    }

    try {
      // Get display media with audio
      this.audioStream = await navigator.mediaDevices.getDisplayMedia({
        audio: {
          sampleRate: this.config.sampleRate,
          channelCount: this.config.channelCount,
          echoCancellation: false, // Don't use echo cancellation for system audio
          noiseSuppression: false,
          autoGainControl: false,
        } as any,
        video: true, // Required for getDisplayMedia, we'll ignore video
      });

      // Extract only audio tracks
      const audioTracks = this.audioStream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error('No audio track in selected source');
      }

      // Stop video tracks as we only need audio
      this.audioStream.getVideoTracks().forEach(track => track.stop());

      // Create new stream with only audio
      const audioOnlyStream = new MediaStream(audioTracks);
      this.audioStream = audioOnlyStream;

      await this.startRecording();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to start system audio capture');
      this.handleError(err);
      throw err;
    }
  }

  /**
   * Start the MediaRecorder
   */
  private async startRecording(): Promise<void> {
    if (!this.audioStream) {
      throw new Error('No audio stream available');
    }

    // Create MediaRecorder with webm opus codec
    const mimeType = this.getSupportedMimeType();
    console.log(`📼 Starting audio recording with MIME type: ${mimeType}`);

    this.isRecording = true;
    this.sequence = 0;

    // Start recording loop - create complete WebM files every 15 seconds
    this.startRecordingLoop(mimeType);
  }

  /**
   * Recording loop that creates complete WebM files
   */
  private startRecordingLoop(mimeType: string): void {
    if (!this.isRecording || !this.audioStream) {
      return;
    }

    // Create new MediaRecorder for this segment
    const recorder = new MediaRecorder(this.audioStream, {
      mimeType,
      audioBitsPerSecond: 128000,
    });

    const chunks: Blob[] = [];

    // Collect all data chunks
    recorder.ondataavailable = (event: BlobEvent) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    // When recording stops, send the complete file
    recorder.onstop = () => {
      if (chunks.length > 0) {
        this.sequence++;
        const completeBlob = new Blob(chunks, { type: mimeType });

        console.log(`📦 Complete audio file #${this.sequence}: ${completeBlob.size} bytes, type: ${completeBlob.type}`);

        if (this.onAudioChunk) {
          this.onAudioChunk(completeBlob, this.sequence);
        }
      }

      // Start next recording segment if still recording
      if (this.isRecording) {
        setTimeout(() => this.startRecordingLoop(mimeType), 100);
      }
    };

    // Handle errors
    recorder.onerror = (event: Event) => {
      const error = new Error(`MediaRecorder error: ${(event as any).error}`);
      this.handleError(error);
    };

    // Start recording without timeslice to get complete WebM file
    recorder.start();

    // Store current recorder
    this.mediaRecorder = recorder;

    // Stop after 10 seconds to create a complete file (shorter = faster transcription)
    setTimeout(() => {
      if (recorder.state === 'recording') {
        recorder.stop();
      }
    }, 10000);
  }

  /**
   * Stop audio capture
   */
  async stopCapture(): Promise<void> {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
    }

    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }

    this.mediaRecorder = null;
    // Don't reset sequence - it should be cumulative across the session
    // this.sequence = 0;
  }

  /**
   * Get supported MIME type for audio recording
   */
  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return ''; // Browser will use default
  }

  /**
   * Handle errors
   */
  private handleError(error: Error): void {
    console.error('Audio capture error:', error);
    if (this.onError) {
      this.onError(error);
    }
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
