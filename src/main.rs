use std::{path::Path, sync::Arc};

use axum::{
    Router,
    extract::State,
    http::{StatusCode, header},
    response::{Html, IntoResponse, Response},
    routing::get,
};
use mlua::LuaSerdeExt as _;
use serde::{Deserialize, Serialize};
use tower_http::services::ServeDir;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Config {
    port: u16,
}

#[derive(Debug)]
struct AppState {
    tailwind_css: String,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let config = toml::from_str::<Config>(&std::fs::read_to_string("config.toml")?)?;

    let tailwind_css =
        paxhtml_tailwind::Tailwind::download(paxhtml_tailwind::RECOMMENDED_VERSION, true)?
            .generate_from_file(Path::new("src/tailwind.css"))?;

    let app = Router::new()
        .route("/", get(index))
        .route("/styles.css", get(styles))
        .with_state(Arc::new(AppState { tailwind_css }))
        .fallback_service(ServeDir::new("static"));

    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", config.port))
        .await
        .unwrap();

    println!("About to serve on port {}", config.port);

    Ok(axum::serve(listener, app).await?)
}

async fn index() -> AppResult<Html<String>> {
    render_lua_page("pages/index.lua").await
}

async fn render_lua_page(path: &str) -> AppResult<Html<String>> {
    let lua = mlua::Lua::new();
    lua.globals().set(
        "inspect",
        lua.load(include_str!("../vendor/inspect.lua/inspect.lua"))
            .eval::<mlua::Value>()?,
    )?;
    lua.load(include_str!("../vendor/luafun/fun.lua"))
        .eval::<mlua::Table>()?
        .for_each(|k: mlua::Value, v: mlua::Value| lua.globals().set(k, v))?;
    lua.globals().set(
        "fetch_json",
        lua.create_async_function(move |lua, url: String| async move {
            let client = reqwest::Client::new();
            let response =
                client.get(url).send().await.map_err(|e| {
                    mlua::Error::RuntimeError(format!("Failed to fetch JSON: {}", e))
                })?;
            let json: serde_json::Value = response
                .json()
                .await
                .map_err(|e| mlua::Error::RuntimeError(format!("Failed to parse JSON: {}", e)))?;
            lua.to_value_with(
                &json,
                mlua::SerializeOptions::new().set_array_metatable(false),
            )
        })?,
    )?;
    paxhtml_mlua::register(&lua)?;

    let chunk = lua.load(tokio::fs::read_to_string(path).await?);
    Ok(Html(
        paxhtml::Document::new([
            paxhtml::builder::doctype(["html".into()]),
            lua.from_value(chunk.eval_async::<mlua::Value>().await?)?,
        ])
        .write_to_string()?,
    ))
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

struct AppError(anyhow::Error);
type AppResult<T> = Result<T, AppError>;

// Tell axum how to convert `AppError` into a response.
impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Something went wrong: {}", self.0),
        )
            .into_response()
    }
}

// This enables using `?` on functions that return `Result<_, anyhow::Error>` to turn them into
// `Result<_, AppError>`. That way you don't need to do that manually.
impl<E> From<E> for AppError
where
    E: Into<anyhow::Error>,
{
    fn from(err: E) -> Self {
        Self(err.into())
    }
}
