import { StatBar, ProgressBarCore } from "../components/ProgressBar";
import { config } from "../config";
import { SectionHeader } from "../components/SectionHeader";
import { useStats } from "../hooks/StatsContext.ts";
import type { AIResourceStatus, AIServiceStatus } from "../../shared/types";

// =============================================================================
// Helpers
// =============================================================================

function round1(n: number): string {
  return (Math.round(n * 10) / 10).toFixed(1);
}

// =============================================================================
// Exported Component
// =============================================================================

export function AIServices() {
  const { aiServices: proxyStatus } = useStats();
  const anankeServiceUrl = `${config.baseUrl}:7071`;

  if (!proxyStatus) {
    return (
      <section>
        <SectionHeader title="ai services" />
        <div className="text-sm text-[var(--color-secondary)] text-center">
          Loading...
        </div>
      </section>
    );
  }

  const resourceEntries = Object.entries(proxyStatus.resources).sort(
    ([a], [b]) => a.localeCompare(b),
  );

  return (
    <section>
      <SectionHeader title="ai services" />
      <div>
        {/* Main ananke tile */}
        <a
          href={anankeServiceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-4 bg-[var(--color-glass)] backdrop-blur-md border border-white/10 shadow-lg hover:bg-[var(--color-glass-hover)] hover:brightness-110 transition-all duration-200 transform mb-2"
        >
          <div className="text-xl font-semibold">ananke</div>
          <div className="text-[var(--color-secondary)] text-sm mb-2">
            {anankeServiceUrl}
          </div>
          <div className="text-sm">
            <div className="italic mb-1">Total Resources:</div>
            {resourceEntries.map(([resource, status]) => {
              const percentage = status.total_available > 0
                ? (status.total_in_use / status.total_available) * 100
                : 0;
              return (
                <StatBar
                  key={resource}
                  label={resource}
                  value={`${round1(status.total_in_use)} / ${round1(status.total_available)} GB`}
                  percentage={percentage}
                />
              );
            })}
          </div>
        </a>

        {/* Individual service tiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {proxyStatus.services.map((service) => (
            <ServiceTile
              key={service.name}
              service={service}
              resources={proxyStatus.resources}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// Internal Components
// =============================================================================

function ServiceTile({
  service,
  resources,
}: {
  service: AIServiceStatus;
  resources: Record<string, AIResourceStatus>;
}) {
  const bgColor = service.is_running
    ? "bg-[var(--color-glass)] backdrop-blur-md border border-white/10"
    : "bg-[var(--color-glass-stopped)] backdrop-blur-md border border-white/10";

  const resourceEntries = Object.entries(service.resource_requirements).sort(
    ([a], [b]) => a.localeCompare(b),
  );

  return (
    <a
      href={service.service_url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block p-4 hover:brightness-125 transition-all duration-200 transform shadow-lg ${bgColor}`}
    >
      <div className="mb-2">
        <div className="font-mono font-medium text-sm">{service.name}</div>
        <div className="text-xs text-[var(--color-secondary)]">
          {service.service_url}
        </div>
      </div>
      <div className="space-y-1">
        {resourceEntries.map(([resource, required]) => {
          const total = resources[resource]?.total_available || 0;

          return (
            <div key={resource} className="text-xs">
              <div className="flex justify-between mb-1">
                <span>{resource}</span>
                <span>
                  {round1(required)}/{round1(total)} GB
                </span>
              </div>
              {service.is_running && (
                <ProgressBarCore
                  percentage={total > 0 ? (required / total) * 100 : 0}
                  color="bg-green-400"
                  rounded
                />
              )}
            </div>
          );
        })}
      </div>
    </a>
  );
}
