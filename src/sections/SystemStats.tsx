import { useState } from "react";
import { SectionHeader } from "../components/SectionHeader";
import { StatBar, ProgressBarCore } from "../components/ProgressBar";
import { useStats } from "../hooks/StatsContext.ts";

// =============================================================================
// Exported Component
// =============================================================================

export function SystemStats() {
  const [showCPUDetail, setShowCPUDetail] = useState(false);

  return (
    <section>
      <SectionHeader title="system stats" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <CPUCard onShowDetail={() => setShowCPUDetail(true)} />
        <MemoryCard />
        <GPUCards />
        <DiskCards />
        <NetworkCard />
      </div>

      {showCPUDetail && (
        <CPUDetailPopover onClose={() => setShowCPUDetail(false)} />
      )}
    </section>
  );
}

// =============================================================================
// Implementation Details
// =============================================================================

function StatCardLoading({ title }: { title: string }) {
  return (
    <div className="p-4 bg-[var(--color-bg-secondary)] shadow-lg animate-pulse">
      <div className="text-lg font-semibold mb-1">{title}</div>
      <div className="h-4 bg-[var(--color-bg)] rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-[var(--color-bg)] rounded w-1/2"></div>
    </div>
  );
}

function CPUCard({ onShowDetail }: { onShowDetail: () => void }) {
  const { cpu: stats } = useStats();

  if (!stats) return <StatCardLoading title="CPU" />;
  return (
    <div
      className="p-4 bg-[var(--color-bg-secondary)] hover:brightness-110 transition-all duration-200 shadow-lg cursor-pointer"
      onClick={onShowDetail}
    >
      <div className="text-lg font-semibold mb-1">CPU</div>
      <StatBar
        label="Usage"
        value={`${stats.usage.toFixed(1)}%`}
        percentage={stats.usage}
        color="bg-green-400"
      />
      <div className="text-xs">
        {stats.temperature !== null && (
          <div className="flex justify-between">
            <span>Temperature</span>
            <span>{stats.temperature.toFixed(1)}°C</span>
          </div>
        )}
        {stats.coreStats && stats.coreStats.length > 0 && (
          <div className="flex justify-between">
            <span>Top Clock</span>
            <span>
              Core {[...stats.coreStats].sort((a, b) => b.mhz - a.mhz)[0].core}{" "}
              @ {[...stats.coreStats].sort((a, b) => b.mhz - a.mhz)[0].mhz} MHz
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function MemoryCard() {
  const { memory: stats } = useStats();

  if (!stats) return <StatCardLoading title="Memory" />;
  return (
    <div className="p-4 bg-[var(--color-bg-secondary)] shadow-lg">
      <div className="text-lg font-semibold mb-1">Memory</div>
      <StatBar
        label="Usage"
        value={`${stats.used.toFixed(1)} / ${stats.total.toFixed(1)} GB`}
        percentage={stats.usage}
        color="bg-purple-400"
      />
      <div className="text-xs">
        <div className="flex justify-between">
          <span>Available</span>
          <span>{stats.available.toFixed(1)} GB</span>
        </div>
      </div>
    </div>
  );
}

function GPUCards() {
  const { gpus } = useStats();

  if (!gpus) return <StatCardLoading title="GPU" />;
  if (gpus.length === 0) return null;

  return (
    <>
      {gpus.map((gpu, index) => (
        <div
          key={index}
          className="p-4 bg-[var(--color-bg-secondary)] shadow-lg"
        >
          <div className="text-lg font-semibold mb-1">
            GPU {gpus.length > 1 ? index : ""}: {gpu.name}
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
          <div className="text-xs">
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
    </>
  );
}

function DiskCards() {
  const { disks } = useStats();

  if (!disks) return <StatCardLoading title="Disks" />;
  if (disks.length === 0) return null;

  return (
    <div className="p-4 bg-[var(--color-bg-secondary)] shadow-lg md:col-span-2">
      <div className="text-lg font-semibold mb-1">Disks</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {disks.map((disk) => (
          <div key={disk.path}>
            <StatBar
              label={disk.path}
              value={`${disk.used.toFixed(1)} / ${disk.total.toFixed(1)} GB (${disk.available.toFixed(1)} GB available)`}
              percentage={disk.usage}
              color="bg-orange-400"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function NetworkCard() {
  const { network } = useStats();

  if (!network) return <StatCardLoading title="Network" />;
  if (network.length === 0) return null;

  return (
    <div className="p-4 bg-[var(--color-bg-secondary)] shadow-lg md:col-span-2">
      <div className="text-lg font-semibold mb-1">Network</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {network.map((net) => (
          <div key={net.interface} className="text-xs flex justify-between">
            <span className="font-semibold">{net.interface}</span>
            <span>
              ↓ {net.rxRate} / ↑ {net.txRate}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CPUDetailPopover({ onClose }: { onClose: () => void }) {
  const { cpu: stats } = useStats();

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

        {!stats && (
          <div className="text-sm text-[var(--color-secondary)]">
            Loading...
          </div>
        )}

        {stats && (
          <>
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
                <div
                  key={core.core}
                  className="p-2 bg-[var(--color-bg-secondary)]"
                >
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold">Core {core.core}</span>
                    <span>{core.mhz} MHz</span>
                  </div>
                  <ProgressBarCore
                    percentage={core.usage}
                    color="bg-green-400"
                    height="h-1.5"
                  />
                  <div className="text-right text-[var(--color-secondary)] mt-0.5">
                    {core.usage.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
