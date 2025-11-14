import type { ServiceStatus, ProxyStatus } from "../types";

export function ServiceTile({
  service,
  proxyStatus,
}: {
  service: ServiceStatus;
  proxyStatus: ProxyStatus;
}) {
  const bgColor = service.is_running
    ? "bg-[var(--color-bg-secondary)]"
    : "bg-[var(--color-stopped)]";

  const resourceEntries = Object.entries(service.resource_requirements).sort(
    ([a], [b]) => a.localeCompare(b)
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
          const total = proxyStatus.resources[resource]?.total_available || 0;

          return (
            <div key={resource} className="text-xs">
              <div className="flex justify-between mb-1">
                <span>{resource}</span>
                <span>
                  {required}/{total}
                </span>
              </div>
              {service.is_running && (
                <div className="w-full bg-black bg-opacity-30 rounded-full h-2 border border-gray-600">
                  <div
                    className="bg-green-400 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${total > 0 ? (required / total) * 100 : 0}%`,
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </a>
  );
}
