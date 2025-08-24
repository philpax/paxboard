base_url = "http://redline"

local_services = {
    {name="jellyfin", url=base_url..":8096"},
    {name="navidrome", url=base_url..":4533"},
    {name="plex", url=base_url..":32400"},
    {name="redlib", url=base_url..":10000"},
}

lmp = {
    name = "large-model-proxy",
    service_url = base_url..":7071",
}

function render()
    return html { lang = "en-AU" } {
        head {} {
            title {} "paxboard",
            meta { charset = "utf-8" },
            meta { name = "viewport", content = "width=device-width, initial-scale=1" },
            link { rel = "stylesheet", href = "/styles.css" },
        },
        body { class = "max-w-[860px] mx-auto text-[var(--color)] bg-[var(--background-color)] p-4 transition-all duration-200 font-['Literata',serif]" } {
            header { class = "w-full" } {
                h1 { class = "text-3xl font-bold mx-auto text-center border-b border-white border-dotted pb-4 italic" } {
                    "paxboard"
                }
            },
            main { class = "mt-4 space-y-8" } {
                -- Local Services Section
                section {} {
                    h2 { class="text-2xl font-semibold mb-2 text-center" } { "local services" },
                    div { class="grid grid-cols-1 md:grid-cols-2 gap-2" } {
                        iter(local_services):map(function(service)
                            local url = service.url
                            return a {
                                href=url,
                                target="_blank",
                                rel="noopener noreferrer",
                                class="block p-4 bg-[var(--background-color-secondary)] hover:brightness-125 transition-all duration-200 transform shadow-lg"
                            } {
                                div { class="text-xl font-semibold" } { service.name },
                                div { class="text-[var(--color-secondary)] text-sm" } { url }
                            }
                        end):totable()
                    }
                },

                -- Large Model Proxy Section
                render_large_model_proxy_section()
            }
        }
    }
end


function render_large_model_proxy_section()
    local name = lmp.name
    local url = lmp.service_url

    local proxy_status = fetch_json(lmp.service_url.."/status")

    return section {} {
        h2 { class="text-2xl font-semibold mb-2 text-center" } { "ai services" },
        div { } {
            -- Main LMP tile
            a {
                href=url, target="_blank", rel="noopener noreferrer",
                class="block p-4 bg-[var(--background-color-secondary)] hover:brightness-125 transition-all duration-200 transform shadow-lg mb-2"
            } {
                div { class="text-xl font-semibold" } { name },
                div { class="text-[var(--color-secondary)] text-sm mb-2" } { url },
                proxy_status and (
                    div { class="text-sm" } {
                        div { class="italic mb-1" } { "Total Resources:" },
                        iter(proxy_status.resources):map(function(resource, resource_status)
                            local percentage = resource_status.total_available > 0 and
                                (resource_status.total_in_use / resource_status.total_available) * 100 or 0

                            return div { class="text-xs mb-2" } {
                                div { class="flex justify-between mb-1" } {
                                    span {} { resource },
                                    span {} { string.format("%d/%d", resource_status.total_in_use, resource_status.total_available) }
                                },
                                div { class="w-full bg-black bg-opacity-30 rounded-full h-2 border border-gray-600" } {
                                    div {
                                        class="bg-blue-400 h-2 rounded-full transition-all duration-300",
                                        style=string.format("width: %d%%", percentage)
                                    } {}
                                }
                            }
                        end):totable()
                    }
                ) or (
                    div { class="text-sm text-[var(--color-secondary)]" } { "Status unavailable" }
                )
            },

            -- Individual service tiles
            proxy_status and (
                div { class="grid grid-cols-1 md:grid-cols-2 gap-2" } {
                    iter(proxy_status.services):map(function(service_status)
                        return render_lmp_service_tile(service_status, proxy_status)
                    end):totable()
                }
            ) or (
                div { class="text-sm text-[var(--color-secondary)] text-center" } { "Status unavailable" }
            )
        }
    }
end


function render_lmp_service_tile(service_status, proxy_status)
    local is_running_style = service_status.is_running and "bg-[var(--background-color-secondary)]" or "bg-[var(--stopped-service-bg)]"
    return a {
        href=service_status.service_url, target="_blank", rel="noopener noreferrer",
        class=string.format("block p-4 hover:brightness-125 transition-all duration-200 transform shadow-lg %s", is_running_style)
    } {
        div { class="mb-2" } {
            div { class="font-mono font-medium text-sm" } { service_status.name },
            div { class="text-xs text-[var(--color-secondary)]" } { service_status.service_url },
        },
        div { class="space-y-1" } {
            iter(service_status.resource_requirements):map(function(resource, required)
                local total = (proxy_status.resources[resource] or {}).total_available or 0

                return div { class="text-xs" } {
                    div { class="flex justify-between mb-1" } {
                        span {} { resource },
                        span {} { string.format("%d/%d", required, total) }
                    },
                    service_status.is_running and (
                        div { class="w-full bg-black bg-opacity-30 rounded-full h-2 border border-gray-600" } {
                            div {
                                class="bg-green-400 h-2 rounded-full transition-all duration-300",
                                style={string.format("width: %d%%", (total > 0 and required / total * 100) or 0)}
                            }
                        }
                    ) or empty_element()
                }
            end):totable()
        }
    }
end

return render()