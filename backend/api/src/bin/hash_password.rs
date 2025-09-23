use std::io;
use bcrypt::{hash, DEFAULT_COST};

fn main() {
    println!("Enter the password for the admin user:");
    let mut password = String::new();
    io::stdin().read_line(&mut password).expect("Failed to read line");
    let password = password.trim(); // Remove newline

    let hashed_password = hash(password, DEFAULT_COST).expect("Failed to hash password");
    println!("\nPassword hashing complete.");
    println!("Copy the SQL statement below and run it in your Supabase SQL Editor to create your admin user.\n");
    
    // Replace 'admin' with your desired username
    println!("INSERT INTO users (username, password_hash) VALUES ('admin', '{}');", hashed_password);
}