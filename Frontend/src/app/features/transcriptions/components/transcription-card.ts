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
}
