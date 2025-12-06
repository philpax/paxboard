// System stats types
export interface CoreStats {
  core: number;
  mhz: number;
  usage: number;
}

export interface CPUStats {
  usage: number;
  temperature: number | null;
  cores: number;
  coreStats: CoreStats[];
}

export interface MemoryStats {
  total: number;
  used: number;
  available: number;
  usage: number;
}

export interface DiskStats {
  path: string;
  total: number;
  used: number;
  available: number;
  usage: number;
}

export interface GPUStats {
  name: string;
  temperature: number;
  utilization: number;
  memoryUsed: number;
  memoryTotal: number;
  memoryUsage: number;
  powerDraw: number;
  powerLimit: number;
}

export interface NetworkStats {
  interface: string;
  rxBytes: number;
  txBytes: number;
  rxRate: string;
  txRate: string;
}

export interface SystemStats {
  cpu: CPUStats;
  memory: MemoryStats;
  disks: DiskStats[];
  gpus: GPUStats[];
  network: NetworkStats[];
  timestamp: number;
}

// AI Services types
export interface AIResourceStatus {
  total_available: number;
  total_in_use: number;
}

export interface AIServiceStatus {
  name: string;
  service_url: string;
  is_running: boolean;
  resource_requirements: Record<string, number>;
}

export interface AIServicesStatus {
  resources: Record<string, AIResourceStatus>;
  services: AIServiceStatus[];
}

// WebSocket message types
export type StatsMessage =
  | { type: "cpu"; data: CPUStats }
  | { type: "memory"; data: MemoryStats }
  | { type: "disks"; data: DiskStats[] }
  | { type: "gpus"; data: GPUStats[] }
  | { type: "network"; data: NetworkStats[] }
  | { type: "aiServices"; data: AIServicesStatus | null };
