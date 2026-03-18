export type TranscriptionStatus = "PENDING" | "PROCESSING" | "DONE" | "FAIL";

export interface TranscriptionJob {
  id: string;
  filename?: string;
  status: TranscriptionStatus;
  transcript?: string | null;
  created_at?: string;
  progress?: number;
}

export interface TranscriptionWsPayload {
  status: TranscriptionStatus;
  id?: string;
  progress?: number;
  transcript?: string;
  new_text?: string;
}

export interface PaginatedTranscriptions {
  items: TranscriptionJob[];
  total: number;
  limit: number;
  offset: number;
}
