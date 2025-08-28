base_url = "http://redline"

local function local_services()
	local services = {
		{ name = "jellyfin", url = base_url .. ":8096" },
		{ name = "navidrome", url = base_url .. ":4533" },
		{ name = "plex", url = base_url .. ":32400" },
		{ name = "redlib", url = base_url .. ":10000" },
	}

	return h.section {} {
		h.h2 { class = "text-2xl font-semibold mb-2 text-center" } { "local services" },
		h.div { class = "grid grid-cols-1 md:grid-cols-2 gap-2" } {
			iter(services):map(function(service)
				local url = service.url
				return h.a {
					href = url,
					target = "_blank",
					rel = "noopener noreferrer",
					class = "block p-4 bg-[var(--background-color-secondary)] hover:brightness-125 transition-all duration-200 transform shadow-lg",
				} {
					h.div { class = "text-xl font-semibold" } { service.name },
					h.div { class = "text-[var(--color-secondary)] text-sm" } { url },
				}
			end):totable(),
		},
	}
end

local function large_model_proxy()
	local lmp = {
		name = "large-model-proxy",
		service_url = base_url .. ":7071",
	}

	local proxy_status = fetch_json(lmp.service_url .. "/status")

	if proxy_status == nil then
		return h.div { class = "text-sm text-[var(--color-secondary)] text-center" } { "Status unavailable" }
	end

	local function main_tile()
		return h.div { class = "text-sm" } {
			h.div { class = "italic mb-1" } { "Total Resources:" },
			iter(proxy_status.resources):map(function(resource, resource_status)
				local percentage = resource_status.total_available > 0
						and (resource_status.total_in_use / resource_status.total_available) * 100
					or 0

				return h.div { class = "text-xs mb-2" } {
					h.div { class = "flex justify-between mb-1" } {
						h.span {} { resource },
						h.span {} {
							string.format("%d/%d", resource_status.total_in_use, resource_status.total_available),
						},
					},
					h.div { class = "w-full bg-black bg-opacity-30 rounded-full h-2 border border-gray-600" } {
						h.div {
							class = "bg-blue-400 h-2 rounded-full transition-all duration-300",
							style = string.format("width: %d%%", percentage),
						} {},
					},
				}
			end):totable(),
		}
	end

	local function service_tile(service_status)
		local is_running_style = service_status.is_running and "bg-[var(--background-color-secondary)]"
			or "bg-[var(--stopped-service-bg)]"
		return h.a {
			href = service_status.service_url,
			target = "_blank",
			rel = "noopener noreferrer",
			class = string.format(
				"block p-4 hover:brightness-125 transition-all duration-200 transform shadow-lg %s",
				is_running_style
			),
		} {
			h.div { class = "mb-2" } {
				h.div { class = "font-mono font-medium text-sm" } { service_status.name },
				h.div { class = "text-xs text-[var(--color-secondary)]" } { service_status.service_url },
			},
			h.div { class = "space-y-1" } {
				iter(service_status.resource_requirements):map(function(resource, required)
					local total = (proxy_status.resources[resource] or {}).total_available or 0

					return h.div { class = "text-xs" } {
						h.div { class = "flex justify-between mb-1" } {
							h.span {} { resource },
							h.span {} { string.format("%d/%d", required, total) },
						},
						service_status.is_running and (h.div {
							class = "w-full bg-black bg-opacity-30 rounded-full h-2 border border-gray-600",
						} {
							h.div {
								class = "bg-green-400 h-2 rounded-full transition-all duration-300",
								style = { string.format("width: %d%%", (total > 0 and required / total * 100) or 0) },
							},
						}) or h.empty(),
					}
				end):totable(),
			},
		}
	end

	return h.section {} {
		h.h2 { class = "text-2xl font-semibold mb-2 text-center" } { "ai services" },
		h.div {} {
			-- Main LMP tile
			h.a {
				href = url,
				target = "_blank",
				rel = "noopener noreferrer",
				class = "block p-4 bg-[var(--background-color-secondary)] hover:brightness-125 transition-all duration-200 transform shadow-lg mb-2",
			} {
				h.div { class = "text-xl font-semibold" } { lmp.name },
				h.div { class = "text-[var(--color-secondary)] text-sm mb-2" } { lmp.service_url },
				main_tile(),
			},

			-- Individual service tiles
			h.div { class = "grid grid-cols-1 md:grid-cols-2 gap-2" } {
				iter(proxy_status.services):map(function(service_status)
					return service_tile(service_status)
				end):totable(),
			},
		},
	}
end

return h.html { lang = "en-AU" } {
	h.head {} {
		h.title {} "paxboard",
		h.meta { charset = "utf-8" },
		h.meta { name = "viewport", content = "width=device-width, initial-scale=1" },
		h.link { rel = "stylesheet", href = "/styles.css" },
	},
	h.body {
		class = "max-w-[860px] mx-auto text-[var(--color)] bg-[var(--background-color)] p-4 transition-all duration-200 font-['Literata',serif]",
	} {
		h.header { class = "w-full" } {
			h.h1 { class = "text-3xl font-bold mx-auto text-center border-b border-white border-dotted pb-4 italic" } {
				"paxboard",
			},
		},
		h.main { class = "mt-4 space-y-8" } {
			local_services(),
			large_model_proxy(),
		},
	},
}
