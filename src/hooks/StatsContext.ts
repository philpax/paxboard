import { createContext, useContext } from "react";
import type {
  CPUStats,
  MemoryStats,
  DiskStats,
  GPUStats,
  NetworkStats,
  ProcessStats,
  AIServicesStatus,
} from "../../shared/types";

export interface StatsState {
  cpu: CPUStats | null;
  memory: MemoryStats | null;
  disks: DiskStats[] | null;
  gpus: GPUStats[] | null;
  network: NetworkStats[] | null;
  processes: ProcessStats[] | null;
  aiServices: AIServicesStatus | null;
  connected: boolean;
  subscribe: (channel: string) => void;
  unsubscribe: (channel: string) => void;
}

export const StatsContext = createContext<StatsState>({
  cpu: null,
  memory: null,
  disks: null,
  gpus: null,
  network: null,
  processes: null,
  aiServices: null,
  connected: false,
  subscribe: () => {},
  unsubscribe: () => {},
});

export function useStats() {
  return useContext(StatsContext);
}
