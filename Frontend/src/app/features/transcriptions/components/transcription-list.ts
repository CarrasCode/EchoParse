import { Component, input } from "@angular/core";
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
            <app-transcription-card [job]="job" />
          }
        </div>
      }
    </div>
  `,
})
export class TranscriptionListComponent {
  readonly jobs = input.required<TranscriptionJob[]>();
}
