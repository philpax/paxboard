import express from "express";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const app = express();
const PORT = 7072;

interface CPUStats {
  usage: number; // percentage
  temperature: number | null; // celsius
  cores: number;
}

interface MemoryStats {
  total: number; // GB
  used: number; // GB
  available: number; // GB
  usage: number; // percentage
}

interface DiskStats {
  path: string;
  total: number; // GB
  used: number; // GB
  available: number; // GB
  usage: number; // percentage
}

interface GPUStats {
  name: string;
  temperature: number; // celsius
  utilization: number; // percentage
  memoryUsed: number; // MB
  memoryTotal: number; // MB
  memoryUsage: number; // percentage
  powerDraw: number; // watts
  powerLimit: number; // watts
}

interface NetworkStats {
  interface: string;
  rxBytes: number; // bytes
  txBytes: number; // bytes
  rxRate: string; // human readable
  txRate: string; // human readable
}

interface SystemStats {
  cpu: CPUStats;
  memory: MemoryStats;
  disks: DiskStats[];
  gpu: GPUStats | null;
  network: NetworkStats[];
  timestamp: number;
}

// Parse CPU usage from top
async function getCPUStats(): Promise<CPUStats> {
  try {
    // Get CPU usage from top
    const { stdout: topOutput } = await execAsync(
      "top -bn1 | grep 'Cpu(s)' | sed 's/.*, *\\([0-9.]*\\)%* id.*/\\1/'"
    );
    const idle = parseFloat(topOutput.trim());
    const usage = Math.round((100 - idle) * 10) / 10;

    // Get number of cores
    const { stdout: coreOutput } = await execAsync("nproc");
    const cores = parseInt(coreOutput.trim());

    // Try to get CPU temperature
    let temperature: number | null = null;
    try {
      const { stdout: tempOutput } = await execAsync(
        "sensors | grep -E 'Package id 0:|Tctl:' | head -1 | grep -oP '\\+\\K[0-9.]+' | head -1"
      );
      const temp = parseFloat(tempOutput.trim());
      if (!isNaN(temp)) {
        temperature = Math.round(temp * 10) / 10;
      }
    } catch {
      // Temperature sensor not available
    }

    return { usage, temperature, cores };
  } catch (error) {
    console.error("Error getting CPU stats:", error);
    return { usage: 0, temperature: null, cores: 0 };
  }
}

// Parse memory from free
async function getMemoryStats(): Promise<MemoryStats> {
  try {
    const { stdout } = await execAsync("free -b | grep Mem");
    const parts = stdout.trim().split(/\s+/);
    const total = parseInt(parts[1]);
    const used = parseInt(parts[2]);
    const available = parseInt(parts[6]);

    return {
      total: Math.round((total / 1024 / 1024 / 1024) * 100) / 100,
      used: Math.round((used / 1024 / 1024 / 1024) * 100) / 100,
      available: Math.round((available / 1024 / 1024 / 1024) * 100) / 100,
      usage: Math.round((used / total) * 1000) / 10,
    };
  } catch (error) {
    console.error("Error getting memory stats:", error);
    return { total: 0, used: 0, available: 0, usage: 0 };
  }
}

// Parse disk usage from df
async function getDiskStats(): Promise<DiskStats[]> {
  try {
    const { stdout } = await execAsync(
      "df -B1 / /home 2>/dev/null | tail -n +2"
    );
    const lines = stdout.trim().split("\n");
    const disks: DiskStats[] = [];

    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 6) {
        const total = parseInt(parts[1]);
        const used = parseInt(parts[2]);
        const available = parseInt(parts[3]);
        const path = parts[5];

        disks.push({
          path,
          total: Math.round((total / 1024 / 1024 / 1024) * 100) / 100,
          used: Math.round((used / 1024 / 1024 / 1024) * 100) / 100,
          available: Math.round((available / 1024 / 1024 / 1024) * 100) / 100,
          usage: Math.round((used / total) * 1000) / 10,
        });
      }
    }

    return disks;
  } catch (error) {
    console.error("Error getting disk stats:", error);
    return [];
  }
}

// Parse GPU stats from nvidia-smi
async function getGPUStats(): Promise<GPUStats | null> {
  try {
    const { stdout } = await execAsync(
      'nvidia-smi --query-gpu=name,temperature.gpu,utilization.gpu,memory.used,memory.total,power.draw,power.limit --format=csv,noheader,nounits'
    );
    const parts = stdout.trim().split(",").map((s) => s.trim());

    if (parts.length >= 7) {
      const memoryUsed = parseFloat(parts[3]);
      const memoryTotal = parseFloat(parts[4]);

      return {
        name: parts[0],
        temperature: parseFloat(parts[1]),
        utilization: parseFloat(parts[2]),
        memoryUsed,
        memoryTotal,
        memoryUsage: Math.round((memoryUsed / memoryTotal) * 1000) / 10,
        powerDraw: parseFloat(parts[5]),
        powerLimit: parseFloat(parts[6]),
      };
    }
    return null;
  } catch (error) {
    // nvidia-smi not available or no GPU
    return null;
  }
}

// Parse network stats from /proc/net/dev
let previousNetworkStats: Map<string, { rx: number; tx: number; time: number }> = new Map();

async function getNetworkStats(): Promise<NetworkStats[]> {
  try {
    const { stdout } = await execAsync("cat /proc/net/dev");
    const lines = stdout.trim().split("\n").slice(2); // Skip headers
    const stats: NetworkStats[] = [];
    const currentTime = Date.now();

    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 10) {
        const iface = parts[0].replace(":", "");

        // Skip loopback
        if (iface === "lo") continue;

        const rxBytes = parseInt(parts[1]);
        const txBytes = parseInt(parts[9]);

        let rxRate = "0 B/s";
        let txRate = "0 B/s";

        // Calculate rate if we have previous data
        const prev = previousNetworkStats.get(iface);
        if (prev) {
          const timeDiff = (currentTime - prev.time) / 1000; // seconds
          const rxDiff = rxBytes - prev.rx;
          const txDiff = txBytes - prev.tx;

          if (timeDiff > 0) {
            rxRate = formatBytes(rxDiff / timeDiff) + "/s";
            txRate = formatBytes(txDiff / timeDiff) + "/s";
          }
        }

        // Update previous stats
        previousNetworkStats.set(iface, { rx: rxBytes, tx: txBytes, time: currentTime });

        stats.push({
          interface: iface,
          rxBytes,
          txBytes,
          rxRate,
          txRate,
        });
      }
    }

    return stats;
  } catch (error) {
    console.error("Error getting network stats:", error);
    return [];
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes.toFixed(0) + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + " MB";
  return (bytes / 1024 / 1024 / 1024).toFixed(1) + " GB";
}

app.get("/system-stats", async (req, res) => {
  try {
    const [cpu, memory, disks, gpu, network] = await Promise.all([
      getCPUStats(),
      getMemoryStats(),
      getDiskStats(),
      getGPUStats(),
      getNetworkStats(),
    ]);

    const stats: SystemStats = {
      cpu,
      memory,
      disks,
      gpu,
      network,
      timestamp: Date.now(),
    };

    res.json(stats);
  } catch (error) {
    console.error("Error gathering system stats:", error);
    res.status(500).json({ error: "Failed to gather system stats" });
  }
});

app.listen(PORT, () => {
  console.log(`System stats server running on port ${PORT}`);
});
