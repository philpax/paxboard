use std::sync::Arc;

use axum::{
    Router,
    extract::State,
    http::header,
    response::{Html, IntoResponse},
    routing::get,
};
use serde::{Deserialize, Serialize};
use tower_http::services::ServeDir;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Config {
    port: u16,
}

#[derive(Debug, Clone)]
struct TailwindCss(Arc<String>);

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let config = toml::from_str::<Config>(&std::fs::read_to_string("config.toml")?)?;

    let tailwind = paxhtml_tailwind::download_and_run(
        paxhtml_tailwind::RECOMMENDED_VERSION,
        true,
        "src/tailwind.css",
    )?;

    let app = Router::new()
        .route("/styles.css", get(styles))
        .route("/", get(index))
        .with_state(TailwindCss(Arc::new(tailwind)))
        .fallback_service(ServeDir::new("static"));

    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", config.port))
        .await
        .unwrap();

    println!("About to serve on port {}", config.port);

    Ok(axum::serve(listener, app).await?)
}

async fn styles(State(tailwind): State<TailwindCss>) -> impl IntoResponse {
    let css = format!(
        r#"
:root {{
--color: #ffffff;
--color-secondary: #cccccc;
--background-color: #3c2954;
--background-color-secondary: #6f4c9a;
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

{}
"#,
        tailwind.0
    )
    .trim()
    .to_string();

    ([(header::CONTENT_TYPE, "text/css")], css)
}

async fn index() -> impl IntoResponse {
    Html(
        layout(paxhtml::html! {
            <div>
                <h1>"Hello, World!"</h1>
            </div>
        })
        .write_to_string()
        .unwrap(),
    )
}

fn layout(inner: paxhtml::Element) -> paxhtml::Document {
    paxhtml::Document::new([
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
                        <h1 class="text-3xl font-bold mx-auto text-center">"paxboard"</h1>
                    </header>
                    <main class="mt-4">{inner}</main>
                </body>
            </html>
        },
    ])
}
