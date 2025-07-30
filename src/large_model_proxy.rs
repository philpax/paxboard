use std::collections::BTreeMap;

use serde::Deserialize;

#[derive(Debug, Clone)]
pub struct LargeModelProxy {
    url: String,
}
impl LargeModelProxy {
    pub fn new(url: String) -> Self {
        Self { url }
    }

    pub fn get_url(&self) -> &str {
        &self.url
    }

    pub async fn get_status(&self) -> reqwest::Result<LargeModelProxyStatus> {
        reqwest::get(format!("{}/status", self.url))
            .await?
            .json::<LargeModelProxyStatus>()
            .await
    }
}

#[derive(Debug, Clone, Deserialize)]
pub struct LargeModelProxyStatus {
    pub services: Vec<LargeModelProxyServiceStatus>,
    pub resources: BTreeMap<String, LargeModelProxyResourceStatus>,
}
#[derive(Debug, Clone, Deserialize)]
#[allow(unused)]
pub struct LargeModelProxyServiceStatus {
    pub name: String,
    pub listen_port: String,
    pub is_running: bool,
    pub active_connections: u32,
    pub last_used: Option<String>,
    pub service_url: String,
    pub resource_requirements: BTreeMap<String, u32>,
}
#[derive(Debug, Clone, Deserialize)]
#[allow(unused)]
pub struct LargeModelProxyResourceStatus {
    pub total_available: u32,
    pub total_in_use: u32,
}
