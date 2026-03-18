import { Component, inject, OnInit, signal } from "@angular/core";
import { TranscriptionService } from "./services/transcription";
import { WebSocketService } from "../../core/services/web-socket";
import {
  TranscriptionJob,
  TranscriptionWsPayload,
} from "./models/transcription";
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

        <app-transcription-list
          [jobs]="jobs()"
          [total]="total()"
          [limit]="limit()"
          [offset]="offset()"
          [expandedId]="expandedId()"
          [loadingDetailIds]="loadingDetailIds()"
          (pageChange)="onPageChange($event)"
          (jobToggle)="onToggleJob($event)"
          (jobDelete)="onDeleteJob($event)"
        />
      </main>
    </div>
  `,
})
export class TranscriptionsComponent implements OnInit {
  private readonly transcriptionService = inject(TranscriptionService);
  private readonly webSocketService = inject(WebSocketService);

  readonly jobs = signal<TranscriptionJob[]>([]);
  readonly total = signal(0);
  readonly limit = signal(10);
  readonly offset = signal(0);
  readonly expandedId = signal<string | null>(null);
  readonly loadingDetailIds = signal<string[]>([]);
  readonly error = signal<string | null>(null);

  ngOnInit() {
    this.loadHistory();
    this.listenToWebSockets();
  }

  onPageChange(nextOffset: number): void {
    this.loadHistory(nextOffset);
  }

  onToggleJob(job: TranscriptionJob): void {
    if (this.expandedId() === job.id) {
      this.expandedId.set(null);
      return;
    }

    this.expandedId.set(job.id);

    if (job.status === "DONE" && !job.transcript) {
      this.loadingDetailIds.update((ids) => [...ids, job.id]);
      this.transcriptionService.getById(job.id).subscribe({
        next: (detail) => {
          this.jobs.update((current) =>
            current.map((j) =>
              j.id === detail.id ? { ...j, transcript: detail.transcript } : j,
            ),
          );
          this.loadingDetailIds.update((ids) =>
            ids.filter((id) => id !== job.id),
          );
        },
        error: () => {
          this.loadingDetailIds.update((ids) =>
            ids.filter((id) => id !== job.id),
          );
        },
      });
    }
  }

  onDeleteJob(job: TranscriptionJob): void {
    if (
      confirm(
        `Are you sure you want to delete the transcription "${job.filename}"?`,
      )
    ) {
      this.transcriptionService.delete(job.id).subscribe({
        next: () => {
          this.jobs.update((current) => current.filter((j) => j.id !== job.id));
          this.total.update((t) => t - 1);
          if (this.expandedId() === job.id) {
            this.expandedId.set(null);
          }
          // Si nos quedamos sin items en la página actual y no estamos en la primera, volvemos a cargar
          if (this.jobs().length === 0 && this.offset() > 0) {
            const newOffset = Math.max(0, this.offset() - this.limit());
            this.loadHistory(newOffset);
          }
        },
        error: () => {
          this.error.set("Failed to delete transcription");
        },
      });
    }
  }

  private loadHistory(offset = this.offset()) {
    this.transcriptionService.getAll(this.limit(), offset).subscribe({
      next: (history) => {
        this.jobs.set(history.items);
        this.total.set(history.total);
        this.offset.set(history.offset);
        history.items.forEach((job) => {
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
      const data = msg.data as TranscriptionWsPayload;

      this.jobs.update((currentJobs) => {
        return currentJobs.map((job) => {
          if (job.id !== msg.ticketId) return job;

          const updatedJob = { ...job, status: data.status };

          if (data.status === "PROCESSING") {
            if (data.progress !== undefined) {
              updatedJob.progress = data.progress;
            }
            if (data.new_text) {
              updatedJob.transcript = job.transcript
                ? `${job.transcript} ${data.new_text}`
                : data.new_text;
            }
          } else if (data.status === "DONE") {
            updatedJob.transcript = data.transcript ?? job.transcript;
            updatedJob.progress = 100;
          }

          return updatedJob;
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
        this.total.update((t) => t + 1);
        this.connectWebSocket(job.id);
      },
      error: (err) => {
        this.error.set(err.error?.detail || "Failed to upload file");
      },
    });
  }
}
