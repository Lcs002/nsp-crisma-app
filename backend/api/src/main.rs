// No longer need to import `SocketAddr` directly if we parse the string
use axum::{response::Json, routing::get, Router};
use serde_json::{json, Value};
use tokio::net::TcpListener; // <-- Import TcpListener from tokio

#[tokio::main]
async fn main() {
    // For local development, load .env variables
    dotenvy::dotenv().ok();

    let app = Router::new()
        .route("/api/health", get(health_check_handler));
        // You will add your other routes for participants, groups, etc., here

    // --- The Changed Part ---
    // 1. Define the address
    let addr = "127.0.0.1:3001";
    
    // 2. Create a `TcpListener`
    let listener = TcpListener::bind(addr).await.unwrap();
    println!("Backend listening on http://{}", addr);

    // 3. Serve the app on the listener
    axum::serve(listener, app).await.unwrap();
}

async fn health_check_handler() -> Json<Value> {
    Json(json!({ "status": "ok" }))
}