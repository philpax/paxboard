use std::{collections::BTreeMap, sync::Arc};

use axum::{
    Router,
    extract::State,
    http::header,
    response::{Html, IntoResponse},
    routing::get,
};
use serde::{Deserialize, Serialize};
use tower_http::services::ServeDir;

mod large_model_proxy;
use large_model_proxy::{LargeModelProxy, LargeModelProxyServiceStatus, LargeModelProxyStatus};

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Config {
    port: u16,
    base_url: String,
}

#[derive(Debug, Clone)]
enum Service {
    Local { port: u16 },
    LargeModelProxy(LargeModelProxy),
}
impl Service {
    pub const fn local(port: u16) -> Self {
        Self::Local { port }
    }
    pub fn large_model_proxy(url: String) -> Self {
        Self::LargeModelProxy(LargeModelProxy::new(url))
    }

    pub fn get_url(&self, base_url: &str) -> String {
        match self {
            Service::Local { port } => format!("{base_url}:{port}/"),
            Service::LargeModelProxy(proxy) => proxy.get_url().to_string(),
        }
    }
}

#[derive(Debug)]
struct AppState {
    tailwind_css: String,
    base_url: String,
    services: BTreeMap<&'static str, Service>,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let config = toml::from_str::<Config>(&std::fs::read_to_string("config.toml")?)?;

    let tailwind_css = paxhtml_tailwind::download_and_run(
        paxhtml_tailwind::RECOMMENDED_VERSION,
        true,
        "src/tailwind.css",
    )?;

    let services = BTreeMap::from([
        ("plex", Service::local(32400)),
        ("jellyfin", Service::local(8096)),
        ("navidrome", Service::local(4533)),
        ("redlib", Service::local(10000)),
        (
            "large-model-proxy",
            Service::large_model_proxy("http://redline:7071".to_string()),
        ),
    ]);

    let app = Router::new()
        .route("/", get(index))
        .route("/styles.css", get(styles))
        .with_state(Arc::new(AppState {
            tailwind_css,
            base_url: config.base_url,
            services,
        }))
        .fallback_service(ServeDir::new("static"));

    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", config.port))
        .await
        .unwrap();

    println!("About to serve on port {}", config.port);

    Ok(axum::serve(listener, app).await?)
}

async fn index(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    let services = &state.services;

    // Separate local services from large model proxy
    let mut local_services = Vec::new();
    let mut large_model_proxy = None;

    for (name, service) in services {
        match service {
            Service::Local { .. } => {
                local_services.push((*name, service));
            }
            Service::LargeModelProxy(_) => {
                large_model_proxy = Some((*name, service));
            }
        }
    }

    // Get large model proxy status if available
    let proxy_status = if let Some((_, Service::LargeModelProxy(proxy))) = large_model_proxy {
        proxy.get_status().await.ok()
    } else {
        None
    };

    let doc = paxhtml::Document::new([
        paxhtml::builder::doctype(["html".into()]),
        paxhtml::html! {
            <html lang="en-AU">
                <head>
                    <title>"paxboard"</title>
                    <meta charset="utf-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                    <link rel="stylesheet" href="/styles.css" />
                </head>
                <body class={format!("max-w-[860px] mx-auto text-[var(--color)] bg-[var(--background-color)] p-4 transition-all duration-200 font-['Literata',serif]")}>
                    <header class="w-full">
                        <h1 class="text-3xl font-bold mx-auto text-center border-b border-white border-dotted pb-4 italic">"paxboard"</h1>
                    </header>
                    <main class="mt-4 space-y-8">
                        // Local Services Section
                        <section>
                            <h2 class="text-2xl font-semibold mb-4 text-center">"local services"</h2>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                #{local_services.iter().map(|(name, service)| {
                                    let url = service.get_url(&state.base_url);
                                    paxhtml::html! {
                                        <a href={url} target="_blank" rel="noopener noreferrer"
                                           class="block p-6 bg-[var(--background-color-secondary)] rounded-lg hover:bg-opacity-80 transition-all duration-200 transform hover:scale-[1.02] shadow-lg">
                                            <div class="text-xl font-semibold mb-2">{name.to_string()}</div>
                                            <div class="text-[var(--color-secondary)] text-sm">{url}</div>
                                        </a>
                                    }
                                })}
                            </div>
                        </section>

                        // Large Model Proxy Section
                        {render_large_model_proxy_section(large_model_proxy, &proxy_status, &state.base_url)}
                    </main>
                </body>
            </html>
        },
    ]);

    Html(doc.write_to_string().unwrap())
}

fn render_large_model_proxy_section(
    large_model_proxy: Option<(&'static str, &Service)>,
    proxy_status: &Option<LargeModelProxyStatus>,
    base_url: &str,
) -> paxhtml::Element {
    if let Some((name, service)) = large_model_proxy {
        let url = service.get_url(base_url);
        paxhtml::html! {
            <section>
                <h2 class="text-2xl font-semibold mb-4 text-center">"ai services"</h2>
                <div class="space-y-4">
                    // Main LMP tile
                    <a href={url.clone()} target="_blank" rel="noopener noreferrer"
                       class="block p-6 bg-[var(--background-color-secondary)] rounded-lg hover:bg-opacity-80 transition-all duration-200 transform hover:scale-[1.02] shadow-lg">
                        <div class="text-xl font-semibold mb-2">{name.to_string()}</div>
                        <div class="text-[var(--color-secondary)] text-sm mb-4">{url}</div>
                        {if let Some(status) = proxy_status {
                            paxhtml::html! {
                                <div class="text-sm">
                                    <div class="font-medium mb-2">"Total Resources:"</div>
                                    #{status.resources.iter().map(|(resource, resource_status)| {
                                        let percentage = if resource_status.total_available > 0 {
                                            (resource_status.total_in_use as f64 / resource_status.total_available as f64) * 100.0
                                        } else { 0.0 };

                                        paxhtml::html! {
                                            <div class="text-xs mb-2">
                                                <div class="flex justify-between mb-1">
                                                    <span>{resource.clone()}</span>
                                                    <span>{format!("{}/{}", resource_status.total_in_use, resource_status.total_available)}</span>
                                                </div>
                                                <div class="w-full bg-black bg-opacity-30 rounded-full h-2 border border-gray-600">
                                                    <div class="bg-blue-400 h-2 rounded-full transition-all duration-300" style={format!("width: {}%", percentage)}>
                                                    </div>
                                                </div>
                                            </div>
                                        }
                                    })}
                                </div>
                            }
                        } else {
                            paxhtml::html! {
                                <div class="text-sm text-[var(--color-secondary)]">"Status unavailable"</div>
                            }
                        }}
                    </a>

                    // Individual service tiles
                    {if let Some(status) = proxy_status {
                        paxhtml::html! {
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                #{status.services.iter().map(|service_status| {
                                    render_lmp_service_tile(service_status, status)
                                })}
                            </div>
                        }
                    } else {
                        paxhtml::html! {
                            <div class="text-sm text-[var(--color-secondary)] text-center">"Status unavailable"</div>
                        }
                    }}
                </div>
            </section>
        }
    } else {
        paxhtml::html! { <div></div> }
    }
}

fn render_lmp_service_tile(
    service_status: &LargeModelProxyServiceStatus,
    proxy_status: &LargeModelProxyStatus,
) -> paxhtml::Element {
    paxhtml::html! {
        <a
            href={service_status.service_url.clone()} target="_blank" rel="noopener noreferrer"
            class={format!("block p-4 rounded-lg hover:bg-opacity-80 transition-all duration-200 transform hover:scale-[1.02] shadow-lg {}", if service_status.is_running { "bg-[var(--background-color-secondary)]" } else { "bg-[var(--stopped-service-bg)]" })}
        >
            <div class="mb-2">
                <div class="font-mono font-medium text-sm">{service_status.name.clone()}</div>
                <div class="text-xs text-[var(--color-secondary)] mt-1">{service_status.service_url.clone()}</div>
            </div>
                        {if !service_status.resource_requirements.is_empty() {
                paxhtml::html! {
                    <div class="space-y-1">
                        #{service_status.resource_requirements.keys().map(|resource| {
                            let required = service_status.resource_requirements.get(resource).unwrap_or(&0);
                            let total = proxy_status.resources.get(resource).map(|r| r.total_available).unwrap_or(0);

                            paxhtml::html! {
                                <div class="text-xs">
                                    <div class="flex justify-between mb-1">
                                        <span>{resource.clone()}</span>
                                        <span>{format!("{}/{}", required, total)}</span>
                                    </div>
                                    {if service_status.is_running {
                                        let percentage = if total > 0 { (*required as f64 / total as f64) * 100.0 } else { 0.0 };
                                        paxhtml::html! {
                                            <div class="w-full bg-black bg-opacity-30 rounded-full h-2 border border-gray-600">
                                                <div class="bg-green-400 h-2 rounded-full transition-all duration-300" style={format!("width: {}%", percentage)}>
                                                </div>
                                            </div>
                                        }
                                    } else {
                                        paxhtml::html! { <div></div> }
                                    }}
                                </div>
                            }
                        })}
                    </div>
                }
            } else {
                paxhtml::html! { <div></div> }
            }}
        </a>
    }
}

async fn styles(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    let css = format!(
        r#"
:root {{
--color: #ffffff;
--color-secondary: #cccccc;
--background-color: #3c2954;
--background-color-secondary: #6f4c9a;
--stopped-service-bg: #374151;
}}

/* Fonts */
@font-face {{
  font-family: "Literata";
  src: url("/fonts/Literata.woff2") format("woff2");
  font-weight: normal;
  font-style: normal;
}}

@font-face {{
  font-family: "Literata";
  src: url("/fonts/Literata-Italic.woff2") format("woff2");
  font-weight: normal;
  font-style: italic;
}}

/* Monospace font fallback */
font-mono {{
  font-family: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace;
}}

{}
"#,
        state.tailwind_css
    )
    .trim()
    .to_string();

    ([(header::CONTENT_TYPE, "text/css")], css)
}
