use axum::{
    async_trait,
    extract::{FromRequestParts, State},
    http::{request::Parts, StatusCode},
    response::{IntoResponse, Response, Json},
};
use axum_extra::extract::cookie::{Cookie, CookieJar, SameSite};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use thiserror::Error;
use crate::{AppState, models::User};
use chrono::{Utc, Duration};
use bcrypt::verify;
use time::OffsetDateTime;

// The name of the secure, HttpOnly cookie we will use to store the JWT.
const JWT_COOKIE_NAME: &str = "crisma_auth_token";

// --- The claims that will be stored in our JWT ---
#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: i32, // Subject (user_id)
    pub exp: i64, // Expiration time (as a UNIX timestamp)
    pub iat: i64, // Issued at time (as a UNIX timestamp)
}

// --- The Extractor that Verifies the JWT from the Cookie ---
// Any handler that has `user: AuthenticatedUser` as a parameter will be protected.
pub struct AuthenticatedUser {
    pub id: i32,
}

#[async_trait]
impl FromRequestParts<AppState> for AuthenticatedUser {
    type Rejection = AuthError;

    async fn from_request_parts(parts: &mut Parts, _state: &AppState) -> Result<Self, Self::Rejection> {
        // Extract the cookie from the request headers
        let jar = CookieJar::from_headers(&parts.headers);
        let token_cookie = jar.get(JWT_COOKIE_NAME).ok_or(AuthError::MissingToken)?;
        let token = token_cookie.value();
        
        // Get the JWT secret from environment variables
        let jwt_secret = std::env::var("JWT_SECRET").map_err(|_| AuthError::Internal)?;
        let decoding_key = DecodingKey::from_secret(jwt_secret.as_bytes());

        // Decode and validate the token. `jsonwebtoken` checks the `exp` claim automatically.
        let decoded = decode::<Claims>(token, &decoding_key, &Validation::default())?;

        // If successful, return the user's ID
        Ok(AuthenticatedUser { id: decoded.claims.sub })
    }
}

// --- The Handler for User Login ---
#[derive(Deserialize)]
pub struct LoginPayload {
    username: String,
    password: String,
}

pub async fn login_handler(
    State(state): State<AppState>,
    jar: CookieJar,
    Json(payload): Json<LoginPayload>,
) -> Result<(CookieJar, Json<User>), AuthError> {
    let conn = state.get().await.map_err(|_| AuthError::Internal)?;
    
    // Find the user by their username
    let user_row = conn.query_opt("SELECT id, username, password_hash FROM users WHERE username = $1", &[&payload.username])
        .await.map_err(|_| AuthError::Internal)?;

    // If no user is found, return an invalid credentials error
    let user_row = user_row.ok_or(AuthError::InvalidCredentials)?;
    
    let user = User {
        id: user_row.get("id"),
        username: user_row.get("username"),
    };
    let password_hash: String = user_row.get("password_hash");

    // Verify the provided password against the stored hash
    if !verify(&payload.password, &password_hash)? {
        return Err(AuthError::InvalidCredentials);
    }
    
    // If the password is correct, create JWT claims
    let now = Utc::now();
    let claims = Claims {
        sub: user.id,
        iat: now.timestamp(),
        exp: (now + Duration::days(7)).timestamp(), // Token is valid for 7 days
    };
    
    let jwt_secret = std::env::var("JWT_SECRET").map_err(|_| AuthError::Internal)?;
    let encoding_key = EncodingKey::from_secret(jwt_secret.as_bytes());

    // Encode the token
    let token = encode(&Header::default(), &claims, &encoding_key)?;

    // Build the secure, HttpOnly cookie
    let cookie = Cookie::build((JWT_COOKIE_NAME.to_string(), token))
        .path("/")
        .http_only(true) // Prevents JavaScript from accessing the cookie
        .secure(true)     // Only send over HTTPS in production
        .same_site(SameSite::Lax)
        .build();

    // Return the new cookie jar and the user's information (without the password hash)
    Ok((jar.add(cookie), Json(user)))
}

// --- The Handler for User Logout ---
pub async fn logout_handler(jar: CookieJar) -> Result<CookieJar, AuthError> {
    // Create a cookie that has the same name but is expired, effectively deleting it
    let cookie = Cookie::build(JWT_COOKIE_NAME)
        .path("/")
        .http_only(true)
        .secure(true)
        .same_site(SameSite::Lax)
        .expires(OffsetDateTime::UNIX_EPOCH) // Set expiration to a time in the past
        .build();

    Ok(jar.add(cookie))
}

// --- Custom Error Type for Clearer Rejections ---

#[derive(Debug, Error)]
pub enum AuthError {
    #[error("missing authorization token")]
    MissingToken,
    #[error("invalid username or password")]
    InvalidCredentials,
    #[error("internal server error")]
    Internal,
    #[error("jsonwebtoken error: {0}")]
    JsonWebToken(#[from] jsonwebtoken::errors::Error),
    #[error("bcrypt error: {0}")]
    Bcrypt(#[from] bcrypt::BcryptError),
}

impl IntoResponse for AuthError {
    fn into_response(self) -> Response {
        // Log the detailed error on the server for debugging
        eprintln!("[AUTH ERROR] {:?}", self);
        
        let (status, error_message) = match self {
            AuthError::MissingToken | AuthError::InvalidCredentials => (StatusCode::UNAUTHORIZED, self.to_string()),
            AuthError::Internal => (StatusCode::INTERNAL_SERVER_ERROR, "An internal error occurred".to_string()),
            _ => (StatusCode::INTERNAL_SERVER_ERROR, "An internal error occurred".to_string()),
        };
        (status, Json(serde_json::json!({ "error": error_message }))).into_response()
    }
}