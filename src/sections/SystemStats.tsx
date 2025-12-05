import { useState, useEffect, useCallback } from "react";
import { SectionHeader } from "../components/SectionHeader";
import { StatBar, ProgressBarCore } from "../components/ProgressBar";
import type {
  CPUStats,
  MemoryStats,
  DiskStats,
  GPUStats,
  NetworkStats,
} from "../../shared/types";

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

type StatState<T> = {
  data: T | null;
  loading: boolean;
  error: boolean;
};

function useStatFetcher<T>(endpoint: string, interval = 2000): StatState<T> {
  const [state, setState] = useState<StatState<T>>({
    data: null,
    loading: true,
    error: false,
  });

  const fetchData = useCallback(() => {
    fetch(endpoint)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        setState({ data, loading: false, error: false });
      })
      .catch((err) => {
        console.error(`Failed to fetch ${endpoint}:`, err);
        setState((prev) => ({ ...prev, loading: false, error: true }));
      });
  }, [endpoint]);

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, interval);
    return () => clearInterval(intervalId);
  }, [fetchData, interval]);

  return state;
}

function StatCardLoading({ title }: { title: string }) {
  return (
    <div className="p-4 bg-[var(--color-bg-secondary)] shadow-lg animate-pulse">
      <div className="text-lg font-semibold mb-1">{title}</div>
      <div className="h-4 bg-[var(--color-bg)] rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-[var(--color-bg)] rounded w-1/2"></div>
    </div>
  );
}

function StatCardError({ title }: { title: string }) {
  return (
    <div className="p-4 bg-[var(--color-bg-secondary)] shadow-lg opacity-50">
      <div className="text-lg font-semibold mb-1">{title}</div>
      <div className="text-xs text-[var(--color-secondary)]">Unavailable</div>
    </div>
  );
}

function CPUCard({ onShowDetail }: { onShowDetail: () => void }) {
  const state = useStatFetcher<CPUStats>("/api/stats/cpu");

  if (state.loading) return <StatCardLoading title="CPU" />;
  if (state.error || !state.data) return <StatCardError title="CPU" />;

  const stats = state.data;
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
              Core{" "}
              {[...stats.coreStats].sort((a, b) => b.mhz - a.mhz)[0].core} @{" "}
              {[...stats.coreStats].sort((a, b) => b.mhz - a.mhz)[0].mhz} MHz
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function MemoryCard() {
  const state = useStatFetcher<MemoryStats>("/api/stats/memory");

  if (state.loading) return <StatCardLoading title="Memory" />;
  if (state.error || !state.data) return <StatCardError title="Memory" />;

  const stats = state.data;
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
  const state = useStatFetcher<GPUStats[]>("/api/stats/gpus");

  if (state.loading) return <StatCardLoading title="GPU" />;
  if (state.error || !state.data) return null;
  if (state.data.length === 0) return null;

  return (
    <>
      {state.data.map((gpu, index) => (
        <div
          key={index}
          className="p-4 bg-[var(--color-bg-secondary)] shadow-lg"
        >
          <div className="text-lg font-semibold mb-1">
            GPU {state.data!.length > 1 ? index : ""}: {gpu.name}
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
  const state = useStatFetcher<DiskStats[]>("/api/stats/disks");

  if (state.loading) return <StatCardLoading title="Disk" />;
  if (state.error || !state.data) return null;
  if (state.data.length === 0) return null;

  return (
    <>
      {state.data.map((disk) => (
        <div
          key={disk.path}
          className="p-4 bg-[var(--color-bg-secondary)] shadow-lg"
        >
          <div className="text-lg font-semibold mb-1">Disk ({disk.path})</div>
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
    </>
  );
}

function NetworkCard() {
  const state = useStatFetcher<NetworkStats[]>("/api/stats/network");

  if (state.loading) return <StatCardLoading title="Network" />;
  if (state.error || !state.data) return null;
  if (state.data.length === 0) return null;

  return (
    <div className="p-4 bg-[var(--color-bg-secondary)] shadow-lg md:col-span-2">
      <div className="text-lg font-semibold mb-1">Network</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {state.data.map((net) => (
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
  );
}

function CPUDetailPopover({ onClose }: { onClose: () => void }) {
  const state = useStatFetcher<CPUStats>("/api/stats/cpu");

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

        {state.loading && (
          <div className="text-sm text-[var(--color-secondary)]">Loading...</div>
        )}

        {state.error && (
          <div className="text-sm text-[var(--color-secondary)]">
            Failed to load CPU details
          </div>
        )}

        {state.data && (
          <>
            <div className="mb-4">
              <StatBar
                label="Total Usage"
                value={`${state.data.usage.toFixed(1)}%`}
                percentage={state.data.usage}
                color="bg-green-400"
              />
              {state.data.temperature !== null && (
                <div className="text-xs mb-2">
                  <div className="flex justify-between">
                    <span>Temperature</span>
                    <span>{state.data.temperature.toFixed(1)}°C</span>
                  </div>
                </div>
              )}
            </div>

            <div className="text-sm font-semibold mb-2">
              Per-Core Stats ({state.data.cores} cores)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {state.data.coreStats.map((core) => (
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
