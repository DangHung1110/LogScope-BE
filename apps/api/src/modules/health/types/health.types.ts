export interface LivenessCheckResponse {
  memoryUsage: NodeJS.MemoryUsage;
  status: 'ok';
  timestamp: string;
  uptime: number;
}

export interface ReadinessCheckResponse {
  database: 'up';
  status: 'ready';
  timestamp: string;
}
