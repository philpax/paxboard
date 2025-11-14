import { useState, useEffect } from "react";
import { ProxyStatus } from "../types";
import { ServiceTile } from "./ServiceTile";
import { ProgressBar } from "./ProgressBar";
import { config } from "../config";

export function AIServices() {
  const [proxyStatus, setProxyStatus] = useState<ProxyStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const lmpServiceUrl = `${config.baseUrl}:7071`;

  useEffect(() => {
    fetch(`${lmpServiceUrl}/status`)
      .then((res) => res.json())
      .then((data) => {
        setProxyStatus(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch proxy status:", err);
        setLoading(false);
      });
  }, [lmpServiceUrl]);

  if (loading) {
    return (
      <section>
        <h2 className="text-2xl font-semibold mb-2 text-center">ai services</h2>
        <div className="text-sm text-[var(--color-secondary)] text-center">Loading...</div>
      </section>
    );
  }

  if (!proxyStatus) {
    return (
      <section>
        <h2 className="text-2xl font-semibold mb-2 text-center">ai services</h2>
        <div className="text-sm text-[var(--color-secondary)] text-center">Status unavailable</div>
      </section>
    );
  }

  const resourceEntries = Object.entries(proxyStatus.resources).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  return (
    <section>
      <h2 className="text-2xl font-semibold mb-2 text-center">ai services</h2>
      <div>
        {/* Main LMP tile */}
        <a
          href={lmpServiceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-4 bg-[var(--color-bg-secondary)] hover:brightness-125 transition-all duration-200 transform shadow-lg mb-2"
        >
          <div className="text-xl font-semibold">large-model-proxy</div>
          <div className="text-[var(--color-secondary)] text-sm mb-2">{lmpServiceUrl}</div>
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
            <ServiceTile key={service.name} service={service} proxyStatus={proxyStatus} />
          ))}
        </div>
      </div>
    </section>
  );
}
