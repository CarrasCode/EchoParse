import { Routes } from "@angular/router";

export const routes: Routes = [
  {
    path: "",
    loadComponent: () =>
      import("./features/transcriptions/transcriptions").then(
        (m) => m.TranscriptionsComponent,
      ),
  },
];
