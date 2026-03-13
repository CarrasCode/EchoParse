export type TranscriptionStatus = "PENDING" | "PROCESSING" | "DONE" | "FAIL";

export interface TranscriptionJob {
  id: string;
  filename?: string;
  status: TranscriptionStatus;
  transcript?: string | null;
  created_at?: string;
}

export interface PaginatedTranscriptions {
  items: TranscriptionJob[];
  total: number;
  limit: number;
  offset: number;
}
