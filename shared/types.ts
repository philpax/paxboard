// System stats types (shared between frontend and server)

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
