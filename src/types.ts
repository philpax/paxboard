export interface Service {
  name: string;
  url: string;
}

export interface ResourceStatus {
  total_available: number;
  total_in_use: number;
}

export interface ServiceStatus {
  name: string;
  service_url: string;
  is_running: boolean;
  resource_requirements: Record<string, number>;
}

export interface ProxyStatus {
  resources: Record<string, ResourceStatus>;
  services: ServiceStatus[];
}
