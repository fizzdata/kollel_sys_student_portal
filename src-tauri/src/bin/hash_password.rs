use argon2::password_hash::{rand_core::OsRng, PasswordHasher, SaltString};
use argon2::Argon2;

fn main() {
    let Some(password) = std::env::args().nth(1) else {
        eprintln!("usage: hash-password <password>");
        std::process::exit(2);
    };
    let salt = SaltString::generate(&mut OsRng);
    let hash = Argon2::default()
        .hash_password(password.as_bytes(), &salt)
        .expect("hashing failed");
    println!("{hash}");
}
