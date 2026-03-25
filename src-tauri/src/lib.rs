use serde::Serialize;

#[derive(Debug, Serialize)]
struct ProxyConfiguration {
  http_proxy: Option<String>,
  https_proxy: Option<String>,
  all_proxy: Option<String>,
  no_proxy: Option<String>,
}

#[tauri::command]
fn get_proxy_configuration() -> ProxyConfiguration {
  ProxyConfiguration {
    http_proxy: std::env::var("HTTP_PROXY").ok().or_else(|| std::env::var("http_proxy").ok()),
    https_proxy: std::env::var("HTTPS_PROXY").ok().or_else(|| std::env::var("https_proxy").ok()),
    all_proxy: std::env::var("ALL_PROXY").ok().or_else(|| std::env::var("all_proxy").ok()),
    no_proxy: std::env::var("NO_PROXY").ok().or_else(|| std::env::var("no_proxy").ok()),
  }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![get_proxy_configuration])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
