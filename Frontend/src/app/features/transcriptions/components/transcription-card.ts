import { Component, input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TranscriptionJob } from "../models/transcription";

@Component({
  selector: "app-transcription-card",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
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

      @if (job().status === "DONE" && job().content) {
        <div
          class="mt-3 p-3 bg-gray-50 rounded text-sm text-gray-700 max-h-32 overflow-y-auto"
        >
          {{ job().content }}
        </div>
      }
    </div>
  `,
})
export class TranscriptionCardComponent {
  readonly job = input.required<TranscriptionJob>();
}
