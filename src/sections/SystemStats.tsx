import { useState, useEffect } from "react";
import type { SystemStats } from "../types";
import { SectionHeader } from "../components/SectionHeader";

interface StatBarProps {
  label: string;
  value: string;
  percentage: number;
  color?: string;
}

function StatBar({ label, value, percentage, color = "bg-blue-400" }: StatBarProps) {
  return (
    <div className="text-xs mb-2">
      <div className="flex justify-between mb-1">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="w-full bg-black bg-opacity-30 h-2 border border-gray-600">
        <div
          className={`${color} h-2 transition-all duration-300`}
          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
        />
      </div>
    </div>
  );
}

export function SystemStats() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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
        <div className="p-4 bg-[var(--color-bg-secondary)] shadow-lg">
          <div className="text-lg font-semibold mb-3">CPU</div>
          <StatBar
            label="Usage"
            value={`${stats.cpu.usage.toFixed(1)}%`}
            percentage={stats.cpu.usage}
            color="bg-green-400"
          />
          {stats.cpu.temperature !== null && (
            <div className="text-xs mb-2">
              <div className="flex justify-between">
                <span>Temperature</span>
                <span>{stats.cpu.temperature.toFixed(1)}°C</span>
              </div>
            </div>
          )}
          <div className="text-xs">
            <div className="flex justify-between">
              <span>Cores</span>
              <span>{stats.cpu.cores}</span>
            </div>
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
          <div key={disk.path} className="p-4 bg-[var(--color-bg-secondary)] shadow-lg">
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
        {stats.gpu && (
          <div className="p-4 bg-[var(--color-bg-secondary)] shadow-lg">
            <div className="text-lg font-semibold mb-3">GPU</div>
            <div className="text-sm text-[var(--color-secondary)] mb-2">
              {stats.gpu.name}
            </div>
            <StatBar
              label="Utilization"
              value={`${stats.gpu.utilization.toFixed(0)}%`}
              percentage={stats.gpu.utilization}
              color="bg-red-400"
            />
            <StatBar
              label="Memory"
              value={`${stats.gpu.memoryUsed.toFixed(0)} / ${stats.gpu.memoryTotal.toFixed(0)} MB`}
              percentage={stats.gpu.memoryUsage}
              color="bg-pink-400"
            />
            <div className="text-xs mb-2">
              <div className="flex justify-between">
                <span>Temperature</span>
                <span>{stats.gpu.temperature.toFixed(0)}°C</span>
              </div>
            </div>
            <div className="text-xs">
              <div className="flex justify-between">
                <span>Power</span>
                <span>
                  {stats.gpu.powerDraw.toFixed(0)} / {stats.gpu.powerLimit.toFixed(0)} W
                </span>
              </div>
            </div>
          </div>
        )}

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
    </section>
  );
}
