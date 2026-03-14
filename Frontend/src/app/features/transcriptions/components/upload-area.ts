import { Component, OnDestroy, output } from "@angular/core";

@Component({
  selector: "app-upload-area",
  standalone: true,
  template: `
    <div class="space-y-4">
      <div
        class="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:bg-gray-50 transition-colors cursor-pointer"
        tabindex="0"
        (click)="fileInput.click()"
        (keydown.enter)="fileInput.click()"
        (keydown.space)="fileInput.click()"
        (dragover)="onDragOver($event)"
        (drop)="onDrop($event)"
        (dragleave)="onDragLeave($event)"
      >
        <input
          type="file"
          #fileInput
          class="hidden"
          accept="audio/*"
          (change)="onFileSelected($event)"
        />

        <svg
          class="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p class="mt-2 text-sm text-gray-600">
          Click to upload or drag and drop
        </p>
        <p class="text-xs text-gray-500">Audio files only (max 50MB)</p>
      </div>

      <div class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div
          class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"
        >
          <div>
            <h3 class="text-base font-semibold text-gray-900">
              Record with your microphone
            </h3>
            <p class="text-sm text-gray-600">
              Record audio in the browser, listen to it, then discard or send
              it.
            </p>
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
              (click)="startRecording()"
              [disabled]="isRecording"
            >
              Start recording
            </button>
            <button
              type="button"
              class="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
              (click)="stopRecording()"
              [disabled]="!isRecording"
            >
              Stop
            </button>
          </div>
        </div>

        @if (isRecording) {
          <div
            class="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            Recording in progress. Click stop when you are done.
          </div>
        }

        @if (errorMessage) {
          <div
            class="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {{ errorMessage }}
          </div>
        }

        @if (previewUrl) {
          <div
            class="mt-4 space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4"
          >
            <div>
              <p class="text-sm font-medium text-gray-900">Recording ready</p>
              <p class="text-sm text-gray-600">
                Review the audio before sending it to transcription.
              </p>
            </div>

            <audio class="w-full" controls [src]="previewUrl"></audio>

            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                (click)="discardRecording()"
              >
                Discard
              </button>
              <button
                type="button"
                class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                (click)="sendRecording()"
                [disabled]="!recordedFile"
              >
                Send recording
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class UploadAreaComponent implements OnDestroy {
  readonly fileSelected = output<File>();

  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private recordedChunks: Blob[] = [];

  protected previewUrl: string | null = null;
  protected recordedFile: File | null = null;
  protected isRecording = false;
  protected errorMessage: string | null = null;

  ngOnDestroy(): void {
    this.stopMediaStream();
    this.clearPreview();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.fileSelected.emit(file);
      input.value = "";
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.fileSelected.emit(files[0]);
    }
  }

  async startRecording(): Promise<void> {
    this.errorMessage = null;

    if (!this.isRecordingSupported()) {
      this.errorMessage = "Your browser does not support microphone recording.";
      return;
    }

    this.discardRecording();

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      this.recordedChunks = [];

      const mimeType = this.getSupportedMimeType();
      this.mediaRecorder = mimeType
        ? new MediaRecorder(this.mediaStream, { mimeType })
        : new MediaRecorder(this.mediaStream);

      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.isRecording = false;
        this.buildRecordingFile();
        this.stopMediaStream();
      };

      this.mediaRecorder.onerror = () => {
        this.errorMessage = "Recording failed. Please try again.";
        this.isRecording = false;
        this.stopMediaStream();
      };

      this.mediaRecorder.start();
      this.isRecording = true;
    } catch {
      this.errorMessage = "Microphone access was denied or is unavailable.";
      this.stopMediaStream();
    }
  }

  stopRecording(): void {
    if (!this.mediaRecorder || !this.isRecording) {
      return;
    }

    this.mediaRecorder.stop();
  }

  discardRecording(): void {
    if (this.isRecording) {
      this.stopRecording();
    }

    this.recordedChunks = [];
    this.recordedFile = null;
    this.clearPreview();
    this.errorMessage = null;
  }

  sendRecording(): void {
    if (!this.recordedFile) {
      return;
    }

    this.fileSelected.emit(this.recordedFile);
    this.discardRecording();
  }

  private isRecordingSupported(): boolean {
    return (
      typeof MediaRecorder !== "undefined" &&
      !!navigator.mediaDevices?.getUserMedia
    );
  }

  private getSupportedMimeType(): string | undefined {
    const mimeTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
    return mimeTypes.find((mimeType) =>
      MediaRecorder.isTypeSupported(mimeType),
    );
  }

  private buildRecordingFile(): void {
    if (this.recordedChunks.length === 0) {
      this.errorMessage = "No audio was captured. Please try again.";
      return;
    }

    const mimeType =
      this.mediaRecorder?.mimeType ||
      this.getSupportedMimeType() ||
      "audio/webm";
    const extension = mimeType.includes("mp4") ? "m4a" : "webm";
    const blob = new Blob(this.recordedChunks, { type: mimeType });

    this.clearPreview();
    this.previewUrl = URL.createObjectURL(blob);
    this.recordedFile = new File(
      [blob],
      `recording-${Date.now()}.${extension}`,
      {
        type: mimeType,
      },
    );
  }

  private clearPreview(): void {
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
    }
    this.previewUrl = null;
  }

  private stopMediaStream(): void {
    this.mediaStream?.getTracks().forEach((track) => track.stop());
    this.mediaStream = null;
    this.mediaRecorder = null;
  }
}
