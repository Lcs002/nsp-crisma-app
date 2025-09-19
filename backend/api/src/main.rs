use axum::{
    routing::{delete, get, post, put},
    Router,
};
use std::sync::Arc;
use tokio::net::TcpListener;

mod db;
mod handlers;
mod models;

pub type AppState = Arc<db::DBPool>;

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();
    let pool = db::create_pool().expect("Failed to create database pool");
    let app_state = Arc::new(pool);

    // --- FIX IS HERE: All routes are now in one continuous chain ---
    let app = Router::new()
        .route("/api/sacraments", get(handlers::list_all_sacraments))
        // Confirmand Routes
        .route("/api/confirmands", get(handlers::list_confirmands))
        .route("/api/confirmands", post(handlers::create_confirmand))
        .route("/api/confirmands/:id", put(handlers::update_confirmand))
        .route("/api/confirmands/:id", delete(handlers::delete_confirmand))
        .route("/api/confirmands/:id/details", get(handlers::get_participant_details))
        .route("/api/confirmands/:id/sacraments", post(handlers::add_sacrament_to_participant))
        .route(
            "/api/confirmands/:confirmandId/sacraments/:sacramentId",
            delete(handlers::remove_sacrament_from_participant),
        )
        
        // Catechist Routes
        .route("/api/catechists", get(handlers::list_catechists))
        .route("/api/catechists", post(handlers::create_catechist))
        
        // Group Routes
        .route("/api/groups", get(handlers::list_groups))
        .route("/api/groups", post(handlers::create_group))
        .route("/api/groups/:id", get(handlers::get_group_details))
        .route("/api/groups/:id/participants", post(handlers::add_participant_to_group))
        .route( // The previously lost route is now correctly part of the chain
            "/api/groups/:groupId/participants/:participantId",
            delete(handlers::remove_participant_from_group)
        )
        .with_state(app_state); // The state is applied at the end of the single chain

    let addr = "127.0.0.1:3001";
    let listener = TcpListener::bind(addr).await.unwrap();
    println!("Backend listening on http://{}", addr);

    axum::serve(listener, app).await.unwrap();
}