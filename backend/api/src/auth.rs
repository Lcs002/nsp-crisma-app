use axum::{
    async_trait,
    extract::{FromRequestParts, State},
    http::{request::Parts, StatusCode},
    response::{IntoResponse, Response},
    Json,
};
use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine as _};
use jsonwebtoken::{decode, decode_header, DecodingKey, Validation};
use once_cell::sync::Lazy;
use reqwest::Client;
use serde::Deserialize;
use std::collections::HashMap;
use std::time::Duration;
use thiserror::Error;
use crate::AppState;
use tokio::sync::Mutex; // Using Tokio's async-aware Mutex

// --- Data Structures for JWT and JWKS Parsing ---

#[derive(Debug, Deserialize)]
struct Claims {
    iss: String,
    sub: String,
    #[serde(default)]
    public_metadata: PublicMetadata,
    sid: Option<String>,
}

#[derive(Debug, Deserialize, Default)]
struct PublicMetadata {
    #[serde(default)]
    role: String,
}

#[derive(Debug, Deserialize, Clone)]
struct Jwks {
    keys: Vec<Jwk>,
}

#[derive(Debug, Deserialize, Clone)]
struct Jwk {
    kid: String,
    n: String,
    e: String,
}

#[derive(Debug, Deserialize)]
struct UnverifiedClaims {
    iss: String,
}

// --- JWKS Caching and Fetching Logic ---

static REQWEST_CLIENT: Lazy<Client> = Lazy::new(|| {
    Client::builder()
        .timeout(Duration::from_secs(5))
        .build()
        .expect("Failed to build reqwest client")
});

// The cache now correctly uses the async-aware Mutex from Tokio.
static JWKS_CACHE: Lazy<Mutex<HashMap<String, Jwks>>> = Lazy::new(|| Mutex::new(HashMap::new()));

async fn get_jwks(issuer: &str) -> Result<Jwks, AuthError> {
    // We `.await` the lock, as this is now an async operation.
    let mut cache = JWKS_CACHE.lock().await;
    if let Some(jwks) = cache.get(issuer) {
        return Ok(jwks.clone());
    }
    
    // The lock is automatically dropped here when `cache` goes out of scope,
    // which happens before the `.await` call below. This is safe.
    drop(cache);

    let jwks_url = format!("{}/.well-known/jwks.json", issuer);
    println!("[AUTH DEBUG] Fetching JWKS from: {}", jwks_url);

    let jwks: Jwks = REQWEST_CLIENT.get(&jwks_url).send().await?.json().await?;
    
    println!("[AUTH DEBUG] Successfully fetched and parsed JWKS.");

    // Re-acquire the lock to update the cache.
    let mut cache = JWKS_CACHE.lock().await;
    cache.insert(issuer.to_string(), jwks.clone());

    Ok(jwks)
}

// --- The Core Extractor ---

// This struct will be extracted from requests if the user is a valid admin.
pub struct AdminUser {
    pub id: String,
}

// This implementation tells Axum how to create an `AdminUser` from a request.
// It is the heart of our authentication and authorization logic.
#[async_trait]
impl FromRequestParts<AppState> for AdminUser {
    type Rejection = AuthError;

    async fn from_request_parts(parts: &mut Parts, _state: &AppState) -> Result<Self, Self::Rejection> {
        let auth_header = parts.headers.get("authorization")
            .and_then(|header| header.to_str().ok())
            .ok_or(AuthError::MissingToken)?;

        let token = auth_header.strip_prefix("Bearer ").ok_or(AuthError::InvalidToken)?;

        let header = decode_header(token)?;
        let kid = header.kid.ok_or(AuthError::InvalidToken)?;

        // Manually decode the token's payload to get the issuer without verification
        let token_parts: Vec<&str> = token.split('.').collect();
        let payload = token_parts.get(1).ok_or(AuthError::InvalidToken)?;
        let decoded_payload = URL_SAFE_NO_PAD.decode(payload)?;
        let unverified_claims: UnverifiedClaims = serde_json::from_slice(&decoded_payload)?;
        let issuer = &unverified_claims.iss;

        // Fetch the public keys for verification
        let jwks = get_jwks(issuer).await?;
        let jwk = jwks.keys.iter().find(|k| k.kid == kid).ok_or(AuthError::InvalidToken)?;

        // Decode and validate the token
        let decoding_key = DecodingKey::from_rsa_components(&jwk.n, &jwk.e)?;
        let mut validation = Validation::new(jsonwebtoken::Algorithm::RS256);
        validation.set_issuer(&[issuer]);

        println!("{:?}", token);

        let decoded_token = decode::<Claims>(token, &decoding_key, &validation)?;

        println!("[AUTH DEBUG] Decoded Token Claims: {:?}", decoded_token.claims);

        // --- Authorization Check ---
        if decoded_token.claims.public_metadata.role != "admin" {
            // Log what was actually received for easier debugging in the future
            eprintln!("[AUTH FORBIDDEN] User '{}' attempted access with role: '{}'", decoded_token.claims.sub, decoded_token.claims.public_metadata.role);
            return Err(AuthError::NotAnAdmin);
        }

        // If all checks pass, return the authenticated admin user's ID
        Ok(AdminUser { id: decoded_token.claims.sub })
    }
}

// --- Custom Error Type ---

#[derive(Debug, Error)]
pub enum AuthError {
    #[error("missing authorization token")]
    MissingToken,
    #[error("invalid authorization token")]
    InvalidToken,
    #[error("user is not an admin")]
    NotAnAdmin,
    #[error("internal server error")]
    Internal,
    #[error("reqwest error: {0}")]
    Reqwest(#[from] reqwest::Error),
    #[error("jsonwebtoken error: {0}")]
    JsonWebToken(#[from] jsonwebtoken::errors::Error),
    #[error("serde_json error: {0}")]
    SerdeJson(#[from] serde_json::Error),
    #[error("base64 decode error: {0}")]
    Base64Decode(#[from] base64::DecodeError),
}

impl IntoResponse for AuthError {
    fn into_response(self) -> Response {
        // Log the detailed error on the server for debugging
        eprintln!("[AUTH ERROR] {:?}", self);
        
        let (status, error_message) = match self {
            AuthError::MissingToken | AuthError::InvalidToken => (StatusCode::UNAUTHORIZED, self.to_string()),
            AuthError::NotAnAdmin => (StatusCode::FORBIDDEN, self.to_string()),
            _ => (StatusCode::INTERNAL_SERVER_ERROR, "An internal error occurred".to_string()),
        };
        (status, Json(serde_json::json!({ "error": error_message }))).into_response()
    }
}