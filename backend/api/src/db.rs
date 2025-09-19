use deadpool_postgres::{Manager, Pool, Runtime};
use std::str::FromStr; // <-- IMPORT THE FromStr TRAIT
use tokio_postgres::NoTls;

pub type DBPool = Pool;

pub fn create_pool() -> Result<DBPool, Box<dyn std::error::Error>> {
    let db_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    // 1. Parse the database URL into a tokio_postgres::Config object.
    //    This now works because `FromStr` is in scope.
    let pg_config = tokio_postgres::Config::from_str(&db_url)?;

    // 2. Create a Manager. We pass it the tokio_postgres::Config and NoTls.
    //    The manager is what knows how to create and recycle connections.
    let manager = Manager::new(pg_config, NoTls);

    // 3. Create the Pool using the manager. This is the new, correct way.
    //    We also configure the pool size here.
    let pool = Pool::builder(manager).max_size(10).build()?;

    Ok(pool)
}