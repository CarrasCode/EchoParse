import { Component, output } from "@angular/core";

@Component({
  selector: "app-upload-area",
  standalone: true,
  template: `
    <div
      class="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:bg-gray-50 transition-colors cursor-pointer"
      (click)="fileInput.click()"
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
      <p class="mt-2 text-sm text-gray-600">Click to upload or drag and drop</p>
      <p class="text-xs text-gray-500">Audio files only (max 50MB)</p>
    </div>
  `,
})
export class UploadAreaComponent {
  readonly fileSelected = output<File>();

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) this.fileSelected.emit(file);
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
}
