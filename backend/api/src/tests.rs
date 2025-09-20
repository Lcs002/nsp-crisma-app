#![cfg(test)]

use super::*;
use axum::{
    body::Body,
    http::{Request, StatusCode},
    Router,
};
use tower::ServiceExt; // for `oneshot`

// A helper to create our app for testing.
// It will automatically use the `.env` file because `db::create_pool()` is called.
async fn setup_app() -> Router {
    let pool = db::create_pool().expect("Failed to create test database pool");
    let app_state = Arc::new(pool);

    // Build the full application router for integration testing
    Router::new()
        .nest("/api/catechists", handlers::catechists_routes())
        .with_state(app_state)
}

#[tokio::test]
async fn test_get_catechists_requires_auth() {
    let app = setup_app().await;

    // Action: Make a request with no auth token.
    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/catechists")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    // Assert: We should get an Unauthorized status because the AdminUser extractor will fail.
    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
}