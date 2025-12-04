import { useState, useEffect } from "react";
import { SectionHeader } from "../components/SectionHeader";

interface CoreStats {
  core: number;
  mhz: number;
  usage: number;
}

interface CPUStats {
  usage: number;
  temperature: number | null;
  cores: number;
  coreStats: CoreStats[];
}

interface MemoryStats {
  total: number;
  used: number;
  available: number;
  usage: number;
}

interface DiskStats {
  path: string;
  total: number;
  used: number;
  available: number;
  usage: number;
}

interface GPUStats {
  name: string;
  temperature: number;
  utilization: number;
  memoryUsed: number;
  memoryTotal: number;
  memoryUsage: number;
  powerDraw: number;
  powerLimit: number;
}

interface NetworkStats {
  interface: string;
  rxBytes: number;
  txBytes: number;
  rxRate: string;
  txRate: string;
}

interface SystemStats {
  cpu: CPUStats;
  memory: MemoryStats;
  disks: DiskStats[];
  gpus: GPUStats[];
  network: NetworkStats[];
  timestamp: number;
}

interface StatBarProps {
  label: string;
  value: string;
  percentage: number;
  color?: string;
}

function StatBar({
  label,
  value,
  percentage,
  color = "bg-blue-400",
}: StatBarProps) {
  return (
    <div className="text-xs mb-2">
      <div className="flex justify-between mb-1">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="w-full bg-black h-2">
        <div
          className={`${color} h-2 transition-all duration-300`}
          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
        />
      </div>
    </div>
  );
}

function CPUDetailPopover({
  stats,
  onClose,
}: {
  stats: CPUStats;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="bg-[var(--color-bg)] p-4 w-[600px] max-h-[80vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="text-lg font-semibold">CPU Details</div>
          <button
            onClick={onClose}
            className="text-[var(--color-secondary)] hover:text-[var(--color-primary)]"
          >
            [x]
          </button>
        </div>

        <div className="mb-4">
          <StatBar
            label="Total Usage"
            value={`${stats.usage.toFixed(1)}%`}
            percentage={stats.usage}
            color="bg-green-400"
          />
          {stats.temperature !== null && (
            <div className="text-xs mb-2">
              <div className="flex justify-between">
                <span>Temperature</span>
                <span>{stats.temperature.toFixed(1)}°C</span>
              </div>
            </div>
          )}
        </div>

        <div className="text-sm font-semibold mb-2">
          Per-Core Stats ({stats.cores} cores)
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {stats.coreStats.map((core) => (
            <div key={core.core} className="p-2 bg-[var(--color-bg-secondary)]">
              <div className="flex justify-between mb-1">
                <span className="font-semibold">Core {core.core}</span>
                <span>{core.mhz} MHz</span>
              </div>
              <div className="w-full bg-black h-1.5">
                <div
                  className="bg-green-400 h-1.5 transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.max(0, core.usage))}%`,
                  }}
                />
              </div>
              <div className="text-right text-[var(--color-secondary)] mt-0.5">
                {core.usage.toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SystemStats() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showCPUDetail, setShowCPUDetail] = useState(false);

  useEffect(() => {
    const fetchStats = () => {
      fetch("/api/system-stats")
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch");
          return res.json();
        })
        .then((data) => {
          setStats(data);
          setLoading(false);
          setError(false);
        })
        .catch((err) => {
          console.error("Failed to fetch system stats:", err);
          setError(true);
          setLoading(false);
        });
    };

    fetchStats();
    const interval = setInterval(fetchStats, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <section>
        <SectionHeader title="system stats" />
        <div className="text-sm text-[var(--color-secondary)] text-center">
          Loading...
        </div>
      </section>
    );
  }

  if (error || !stats) {
    return (
      <section>
        <SectionHeader title="system stats" />
        <div className="text-sm text-[var(--color-secondary)] text-center">
          Stats unavailable
        </div>
      </section>
    );
  }

  return (
    <section>
      <SectionHeader title="system stats" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {/* CPU Stats */}
        <div
          className="p-4 bg-[var(--color-bg-secondary)] hover:brightness-110 transition-all duration-200 shadow-lg cursor-pointer"
          onClick={() => setShowCPUDetail(true)}
        >
          <div className="text-lg font-semibold mb-3">CPU</div>
          <StatBar
            label="Usage"
            value={`${stats.cpu.usage.toFixed(1)}%`}
            percentage={stats.cpu.usage}
            color="bg-green-400"
          />
          <div className="text-xs space-y-0.5">
            {stats.cpu.temperature !== null && (
              <div className="flex justify-between">
                <span>Temperature</span>
                <span>{stats.cpu.temperature.toFixed(1)}°C</span>
              </div>
            )}
            {stats.cpu.coreStats && stats.cpu.coreStats.length > 0 && (
              <div className="flex justify-between">
                <span>Top Clock</span>
                <span>
                  Core{" "}
                  {
                    [...stats.cpu.coreStats].sort((a, b) => b.mhz - a.mhz)[0]
                      .core
                  }{" "}
                  @{" "}
                  {
                    [...stats.cpu.coreStats].sort((a, b) => b.mhz - a.mhz)[0]
                      .mhz
                  }{" "}
                  MHz
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Memory Stats */}
        <div className="p-4 bg-[var(--color-bg-secondary)] shadow-lg">
          <div className="text-lg font-semibold mb-3">Memory</div>
          <StatBar
            label="Usage"
            value={`${stats.memory.used.toFixed(1)} / ${stats.memory.total.toFixed(1)} GB`}
            percentage={stats.memory.usage}
            color="bg-purple-400"
          />
          <div className="text-xs">
            <div className="flex justify-between">
              <span>Available</span>
              <span>{stats.memory.available.toFixed(1)} GB</span>
            </div>
          </div>
        </div>

        {/* Disk Stats */}
        {stats.disks.map((disk) => (
          <div
            key={disk.path}
            className="p-4 bg-[var(--color-bg-secondary)] shadow-lg"
          >
            <div className="text-lg font-semibold mb-3">Disk ({disk.path})</div>
            <StatBar
              label="Usage"
              value={`${disk.used.toFixed(1)} / ${disk.total.toFixed(1)} GB`}
              percentage={disk.usage}
              color="bg-orange-400"
            />
            <div className="text-xs">
              <div className="flex justify-between">
                <span>Available</span>
                <span>{disk.available.toFixed(1)} GB</span>
              </div>
            </div>
          </div>
        ))}

        {/* GPU Stats */}
        {stats.gpus.map((gpu, index) => (
          <div
            key={index}
            className="p-4 bg-[var(--color-bg-secondary)] shadow-lg"
          >
            <div className="text-lg font-semibold mb-3">
              GPU {stats.gpus.length > 1 ? index : ""}
            </div>
            <div className="text-sm text-[var(--color-secondary)] mb-2">
              {gpu.name}
            </div>
            <StatBar
              label="Utilization"
              value={`${gpu.utilization.toFixed(0)}%`}
              percentage={gpu.utilization}
              color="bg-red-400"
            />
            <StatBar
              label="Memory"
              value={`${gpu.memoryUsed.toFixed(0)} / ${gpu.memoryTotal.toFixed(0)} MB`}
              percentage={gpu.memoryUsage}
              color="bg-pink-400"
            />
            <div className="text-xs mb-2">
              <div className="flex justify-between">
                <span>Temperature</span>
                <span>{gpu.temperature.toFixed(0)}°C</span>
              </div>
            </div>
            <div className="text-xs">
              <div className="flex justify-between">
                <span>Power</span>
                <span>
                  {gpu.powerDraw.toFixed(0)} / {gpu.powerLimit.toFixed(0)} W
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Network Stats */}
        {stats.network.length > 0 && (
          <div className="p-4 bg-[var(--color-bg-secondary)] shadow-lg md:col-span-2">
            <div className="text-lg font-semibold mb-3">Network</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats.network.map((net) => (
                <div key={net.interface} className="text-xs">
                  <div className="font-semibold mb-2">{net.interface}</div>
                  <div className="flex justify-between mb-1">
                    <span>↓ Download</span>
                    <span>{net.rxRate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>↑ Upload</span>
                    <span>{net.txRate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showCPUDetail && (
        <CPUDetailPopover
          stats={stats.cpu}
          onClose={() => setShowCPUDetail(false)}
        />
      )}
    </section>
  );
}
