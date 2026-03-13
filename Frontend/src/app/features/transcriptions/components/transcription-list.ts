import { Component, input, output } from "@angular/core";
import { TranscriptionJob } from "../models/transcription";
import { TranscriptionCardComponent } from "./transcription-card";

@Component({
  selector: "app-transcription-list",
  standalone: true,
  imports: [TranscriptionCardComponent],
  template: `
    <div class="flex flex-col gap-4 mt-8">
      <h2 class="text-xl font-semibold text-gray-800">Your Transcriptions</h2>

      @if (jobs().length === 0) {
        <p class="text-gray-500 text-center py-8">
          No transcriptions yet. Upload an audio file to get started.
        </p>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          @for (job of jobs(); track job.id) {
            <app-transcription-card
              [job]="job"
              [expanded]="expandedId() === job.id"
              [loadingDetail]="loadingDetailIds().includes(job.id)"
              (toggleExpand)="jobToggle.emit(job)"
            />
          }
        </div>

        <div class="flex justify-between items-center mt-6">
          <button
            (click)="previousPage()"
            [disabled]="offset() === 0"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span class="text-sm text-gray-600">
            Showing {{ offset() + 1 }} -
            {{ Math.min(offset() + limit(), total()) }} of
            {{ total() }}
          </span>
          <button
            (click)="nextPage()"
            [disabled]="offset() + limit() >= total()"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      }
    </div>
  `,
})
export class TranscriptionListComponent {
  readonly jobs = input.required<TranscriptionJob[]>();
  readonly total = input.required<number>();
  readonly limit = input.required<number>();
  readonly offset = input.required<number>();
  readonly expandedId = input.required<string | null>();
  readonly loadingDetailIds = input.required<string[]>();

  readonly pageChange = output<number>();
  readonly jobToggle = output<TranscriptionJob>();

  protected readonly Math = Math;

  previousPage() {
    this.pageChange.emit(Math.max(0, this.offset() - this.limit()));
  }

  nextPage() {
    this.pageChange.emit(this.offset() + this.limit());
  }
}
