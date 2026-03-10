export type TranscriptionStatus = "PENDING" | "PROCESSING" | "DONE" | "FAIL";

export interface TranscriptionJob {
  id: string;
  filename: string;
  status: TranscriptionStatus;
  content?: string;
  created_at: string;
}
