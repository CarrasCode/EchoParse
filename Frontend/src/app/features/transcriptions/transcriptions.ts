import { Component, inject, OnInit, signal } from "@angular/core";
import { TranscriptionService } from "./services/transcription";
import { WebSocketService } from "../../core/services/web-socket";
import { TranscriptionJob } from "./models/transcription";
import { UploadAreaComponent } from "./components/upload-area";
import { TranscriptionListComponent } from "./components/transcription-list";

@Component({
  selector: "app-transcriptions",
  standalone: true,
  imports: [UploadAreaComponent, TranscriptionListComponent],
  template: `
    <div class="container mx-auto max-w-4xl p-6">
      <header class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">EchoParse</h1>
        <p class="text-gray-600">Your private audio transcription API</p>
      </header>

      <main>
        <app-upload-area (fileSelected)="onFileSelected($event)" />

        @if (error()) {
          <div class="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {{ error() }}
          </div>
        }

        <app-transcription-list [jobs]="jobs()" />
      </main>
    </div>
  `,
})
export class TranscriptionsComponent implements OnInit {
  private readonly transcriptionService = inject(TranscriptionService);
  private readonly webSocketService = inject(WebSocketService);

  readonly jobs = signal<TranscriptionJob[]>([]);
  readonly error = signal<string | null>(null);

  ngOnInit() {
    this.loadHistory();
    this.listenToWebSockets();
  }

  private loadHistory() {
    this.transcriptionService.getAll().subscribe({
      next: (history) => {
        this.jobs.set(history);
        history.forEach((job) => {
          if (job.status === "PENDING" || job.status === "PROCESSING") {
            this.connectWebSocket(job.id);
          }
        });
      },
      error: () => this.error.set("Failed to load transcription history"),
    });
  }

  private listenToWebSockets() {
    this.webSocketService.messages$.subscribe((msg) => {
      this.jobs.update((currentJobs) => {
        return currentJobs.map((job) => {
          if (job.id === msg.ticketId) {
            return {
              ...job,
              status: msg.data.status,
              content: msg.data.transcript || job.content,
            };
          }
          return job;
        });
      });
    });
  }

  private connectWebSocket(ticketId: string) {
    const host = window.location.hostname;
    const port = 8000;
    const wsUrl = `ws://${host}:${port}/api/v1/transcriptions/ws/${ticketId}`;
    this.webSocketService.connect(ticketId, wsUrl);
  }

  onFileSelected(file: File): void {
    this.error.set(null);
    this.transcriptionService.upload(file).subscribe({
      next: (job) => {
        this.jobs.update((current) => [job, ...current]);
        this.connectWebSocket(job.id);
      },
      error: (err) => {
        this.error.set(err.error?.detail || "Failed to upload file");
      },
    });
  }
}
