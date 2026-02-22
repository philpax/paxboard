import { config } from "../config";
import { SectionHeader } from "../components/SectionHeader";

export function LocalServices() {
  const services: { name: string; url: string }[] = [
    { name: "jellyfin", url: `${config.baseUrl}:8096` },
    { name: "navidrome", url: `${config.baseUrl}:4533` },
    { name: "redlib", url: `${config.baseUrl}:10000` },
    { name: "immich", url: `${config.baseUrl}:2283` },
  ];

  return (
    <section>
      <SectionHeader title="local services" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {services.map((service) => (
          <a
            key={service.name}
            href={service.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 bg-[var(--color-glass)] backdrop-blur-md border border-white/10 shadow-lg hover:bg-[var(--color-glass-hover)] hover:brightness-110 transition-all duration-200 transform"
          >
            <div className="text-xl font-semibold">{service.name}</div>
            <div className="text-[var(--color-secondary)] text-sm">
              {service.url}
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
