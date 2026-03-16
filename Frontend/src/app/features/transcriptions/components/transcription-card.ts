import { Component, input, output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TranscriptionJob } from "../models/transcription";

@Component({
  selector: "app-transcription-card",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:border-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
      (click)="toggleExpand.emit()"
      (keydown.enter)="toggleExpand.emit()"
      (keydown.space)="$event.preventDefault(); toggleExpand.emit()"
      role="button"
      tabindex="0"
    >
      <div class="flex justify-between items-start mb-2">
        <div>
          <h3 class="font-medium text-gray-900">{{ job().filename }}</h3>
          <p class="text-xs text-gray-500">
            {{ job().created_at | date: "short" }}
          </p>
        </div>
        <div class="flex items-center gap-2">
          <span
            class="px-2.5 py-0.5 rounded-full text-xs font-medium"
            [ngClass]="{
              'bg-yellow-100 text-yellow-800': job().status === 'PENDING',
              'bg-blue-100 text-blue-800': job().status === 'PROCESSING',
              'bg-green-100 text-green-800': job().status === 'DONE',
              'bg-red-100 text-red-800': job().status === 'FAIL',
            }"
          >
            {{ job().status }}
          </span>
          <button
            (click)="$event.stopPropagation(); deleteJob.emit(job())"
            (keydown.enter)="$event.stopPropagation(); deleteJob.emit(job())"
            (keydown.space)="$event.stopPropagation(); deleteJob.emit(job())"
            class="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
            title="Delete transcription"
            aria-label="Delete"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- Indeterminate Progress Bar for Processing -->
      @if (job().status === "PROCESSING") {
        <div class="w-full bg-gray-200 rounded-full h-2 mb-2 overflow-hidden">
          <div
            class="bg-blue-600 h-2 rounded-full w-full animate-pulse-fast"
          ></div>
        </div>
      } @else if (job().status === "DONE") {
        <div class="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div class="bg-green-600 h-2 rounded-full w-full"></div>
        </div>
      }

      @if (job().status === "DONE") {
        <div
          class="mt-2 flex justify-between items-center text-xs font-medium text-blue-600"
        >
          <span>{{ expanded() ? "Hide transcript" : "Show transcript" }}</span>
          @if (loadingDetail()) {
            <span class="animate-pulse">Loading...</span>
          }
        </div>

        @if (expanded() && job().transcript) {
          <div
            class="mt-3 p-3 bg-gray-50 rounded text-sm text-gray-700 max-h-60 overflow-y-auto"
            (click)="$event.stopPropagation()"
            (keydown)="$event.stopPropagation()"
            role="presentation"
          >
            {{ job().transcript }}
          </div>
        }
      }
    </div>
  `,
})
export class TranscriptionCardComponent {
  readonly job = input.required<TranscriptionJob>();
  readonly expanded = input<boolean>(false);
  readonly loadingDetail = input<boolean>(false);
  readonly toggleExpand = output<void>();
  readonly deleteJob = output<TranscriptionJob>();
}
