import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import {
  PaginatedTranscriptions,
  TranscriptionJob,
} from "../models/transcription";

@Injectable({
  providedIn: "root",
})
export class TranscriptionService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = "/api/v1/transcriptions/";

  upload(file: File): Observable<TranscriptionJob> {
    const formData = new FormData();
    formData.append("file", file);
    return this.http.post<TranscriptionJob>(this.apiUrl, formData);
  }

  getById(id: string): Observable<TranscriptionJob> {
    return this.http.get<TranscriptionJob>(`${this.apiUrl}${id}`);
  }

  getAll(limit = 10, offset = 0): Observable<PaginatedTranscriptions> {
    return this.http.get<PaginatedTranscriptions>(this.apiUrl, {
      params: { limit: limit.toString(), offset: offset.toString() },
    });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}`);
  }
}
