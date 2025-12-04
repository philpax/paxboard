import { useState, useEffect } from "react";
import { ProgressBar, ProgressBarCore } from "../components/ProgressBar";
import { config } from "../config";
import { SectionHeader } from "../components/SectionHeader";

interface ResourceStatus {
  total_available: number;
  total_in_use: number;
}

interface ServiceStatus {
  name: string;
  service_url: string;
  is_running: boolean;
  resource_requirements: Record<string, number>;
}

interface ProxyStatus {
  resources: Record<string, ResourceStatus>;
  services: ServiceStatus[];
}

function ServiceTile({
  service,
  resources,
}: {
  service: ServiceStatus;
  resources: Record<string, ResourceStatus>;
}) {
  const bgColor = service.is_running
    ? "bg-[var(--color-bg-secondary)]"
    : "bg-[var(--color-stopped)]";

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
                  {required}/{total}
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

export function AIServices() {
  const [proxyStatus, setProxyStatus] = useState<ProxyStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const lmpServiceUrl = `${config.baseUrl}:7071`;
  const proxyUrl = "/api"; // Use Vite proxy to avoid CORS

  useEffect(() => {
    fetch(`${proxyUrl}/status`)
      .then((res) => res.json())
      .then((data) => {
        setProxyStatus(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch proxy status:", err);
        setLoading(false);
      });
  }, [proxyUrl]);

  if (loading) {
    return (
      <section>
        <h2 className="text-2xl font-semibold mb-2 text-center">ai services</h2>
        <div className="text-sm text-[var(--color-secondary)] text-center">
          Loading...
        </div>
      </section>
    );
  }

  if (!proxyStatus) {
    return (
      <section>
        <h2 className="text-2xl font-semibold mb-2 text-center">ai services</h2>
        <div className="text-sm text-[var(--color-secondary)] text-center">
          Status unavailable
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
        {/* Main LMP tile */}
        <a
          href={lmpServiceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-4 bg-[var(--color-bg-secondary)] hover:brightness-125 transition-all duration-200 transform shadow-lg mb-2"
        >
          <div className="text-xl font-semibold">large-model-proxy</div>
          <div className="text-[var(--color-secondary)] text-sm mb-2">
            {lmpServiceUrl}
          </div>
          <div className="text-sm">
            <div className="italic mb-1">Total Resources:</div>
            {resourceEntries.map(([resource, status]) => (
              <ProgressBar
                key={resource}
                current={status.total_in_use}
                total={status.total_available}
                label={resource}
              />
            ))}
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
