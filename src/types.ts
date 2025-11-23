export interface Service {
  name: string;
  url: string;
}

export interface ResourceStatus {
  total_available: number;
  total_in_use: number;
}

export interface ServiceStatus {
  name: string;
  service_url: string;
  is_running: boolean;
  resource_requirements: Record<string, number>;
}

export interface ProxyStatus {
  resources: Record<string, ResourceStatus>;
  services: ServiceStatus[];
}

export interface CPUStats {
  usage: number;
  temperature: number | null;
  cores: number;
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
  gpu: GPUStats | null;
  network: NetworkStats[];
  timestamp: number;
}
