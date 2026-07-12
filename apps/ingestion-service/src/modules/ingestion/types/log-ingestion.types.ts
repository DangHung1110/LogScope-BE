export interface AcceptedLogResponse {
  accepted: true;
  eventId: string;
}

export interface AcceptedBatchLogResponse {
  accepted: true;
  count: number;
  eventIds: string[];
}
