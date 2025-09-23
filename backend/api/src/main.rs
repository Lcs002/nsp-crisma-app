use axum::{
    routing::{delete, get, post, put},
    Router,  middleware,
};
use std::sync::Arc;
use tokio::net::TcpListener;

mod db;
mod handlers;
mod auth;
mod models;

pub type AppState = Arc<db::DBPool>;

#[tokio::main]
async fn main() {
    if let Err(e) = dotenvy::dotenv() {
        println!("Could not load .env file: {}", e);
    }
    let pool = db::create_pool().expect("Failed to create database pool");
    let app_state = Arc::new(pool);

    // --- THIS IS THE REFACTORED ROUTER ---

    let auth_routes = Router::new()
        .route("/login", post(auth::login_handler))
        .route("/logout", post(auth::logout_handler));

    // Define routes for Participants (Confirmands)
    let confirmands_routes = Router::new()
        .route("/", get(handlers::list_confirmands).post(handlers::create_confirmand))
        .route("/import", post(handlers::import_confirmands_from_csv))
        .route("/:id", put(handlers::update_confirmand).delete(handlers::delete_confirmand))
        .route("/:id/details", get(handlers::get_participant_details))
        .route("/:id/sacraments", post(handlers::add_sacrament_to_participant))
        .route(
            "/:confirmandId/sacraments/:sacramentId",
            delete(handlers::remove_sacrament_from_participant),
        );

    // Define routes for Catechists
    let catechists_routes = Router::new()
        .route("/", get(handlers::list_catechists).post(handlers::create_catechist))
        .route("/:id/details", get(handlers::get_catechist_details));

    // Define routes for Groups
    let groups_routes = Router::new()
        .route("/", get(handlers::list_groups).post(handlers::create_group))
        .route("/:id", get(handlers::get_group_details))
        .route("/:id/participants", post(handlers::add_participant_to_group))
        .route(
            "/:groupId/participants/:participantId",
            delete(handlers::remove_participant_from_group),
        );

    // Combine all the routers into the main app router using `nest`
    let app = Router::new()
        .route("/api/dashboard/stats", get(handlers::get_dashboard_stats))
        .route("/api/sacraments", get(handlers::list_all_sacraments))
        .nest("/api/confirmands", confirmands_routes)
        .nest("/api/catechists", catechists_routes)
        .nest("/api/groups", groups_routes)
        .nest("/api/auth", auth_routes)
        //.layer(middleware::from_fn(auth::auth_middleware))
        .with_state(app_state);

    // Bind to the port provided by the platform via the `PORT` env var
    // and listen on all interfaces so the container can accept external traffic.
    let port: u16 = std::env::var("PORT").ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(3001);
    let addr = format!("0.0.0.0:{}", port);
    let listener = TcpListener::bind(&addr).await.expect(&format!("Failed to bind to {}", addr));
    println!("Backend listening on http://{}", addr);

    axum::serve(listener, app).await.unwrap();
}