import { createContext, useContext } from "react";
import type {
  CPUStats,
  MemoryStats,
  DiskStats,
  GPUStats,
  NetworkStats,
  AIServicesStatus,
} from "../../shared/types";

export interface StatsState {
  cpu: CPUStats | null;
  memory: MemoryStats | null;
  disks: DiskStats[] | null;
  gpus: GPUStats[] | null;
  network: NetworkStats[] | null;
  aiServices: AIServicesStatus | null;
  connected: boolean;
}

export const StatsContext = createContext<StatsState>({
  cpu: null,
  memory: null,
  disks: null,
  gpus: null,
  network: null,
  aiServices: null,
  connected: false,
});

export function useStats() {
  return useContext(StatsContext);
}
