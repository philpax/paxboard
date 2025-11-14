import { Service } from "../types";
import { config } from "../config";

export function LocalServices() {
  const services: Service[] = [
    { name: "jellyfin", url: `${config.baseUrl}:8096` },
    { name: "navidrome", url: `${config.baseUrl}:4533` },
    { name: "plex", url: `${config.baseUrl}:32400` },
    { name: "redlib", url: `${config.baseUrl}:10000` },
  ];

  return (
    <section>
      <h2 className="text-2xl font-semibold mb-2 text-center">local services</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {services.map((service) => (
          <a
            key={service.name}
            href={service.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 bg-[var(--color-bg-secondary)] hover:brightness-125 transition-all duration-200 transform shadow-lg"
          >
            <div className="text-xl font-semibold">{service.name}</div>
            <div className="text-[var(--color-secondary)] text-sm">{service.url}</div>
          </a>
        ))}
      </div>
    </section>
  );
}
