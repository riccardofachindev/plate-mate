# Rust Async Programming Reference

**Source:** Context7 - rust-lang/rust
**Last Updated:** 2026-01-09

## Overview

Rust's async programming model enables efficient concurrent code execution without blocking threads. This reference focuses on async functions, traits, and common patterns.

---

## Async Functions

### Basic Async Function

Async functions return `impl Future<Output = T>` implicitly.

```rust
async fn foo() -> User {
    unimplemented!()
}

// Equivalent desugared form
fn foo(&self) -> impl Future<Output = User> + '_ {
    unimplemented!()
}
```

### Async Function Syntax
- **`async fn`** - Syntactic sugar for functions returning `Future`
- Automatically creates state machine for suspension points
- Must be `.await`ed to execute

---

## Lifetimes in Async Functions

### Self with Lifetimes

When using `Self` in async functions with lifetime parameters, explicitly specify the type:

**❌ Problematic (old versions):**
```rust
struct S<'a>(&'a i32);

impl<'a> S<'a> {
    async fn new(i: &'a i32) -> Self {  // Self references parent lifetime
        S(&22)
    }
}
```

**✅ Correct:**
```rust
struct S<'a>(&'a i32);

impl<'a> S<'a> {
    async fn new(i: &'a i32) -> S<'a> {  // Explicitly name the type
        S(&22)
    }
}
```

**Why:** `Self` in return position can create implicit lifetime projections. Explicitly naming `S<'a>` avoids this issue.

---

## Async Closures

### AsyncFnOnce Trait Bound

Async closures can be constrained by trait bounds that affect capture semantics:

```rust
fn force_fnonce<T: async FnOnce()>(t: T) -> T { t }

let x = String::new();
let c = force_fnonce(async move || {
    println!("{x}");  // x is moved, not borrowed
});
```

**Key Points:**
- `AsyncFnOnce` forces move semantics
- Even if the closure would naturally borrow, the trait bound requires ownership
- Similar to regular `FnOnce` but for async contexts

---

## Async in Traits

### Current Status (as of context fetch)

**❌ Not Yet Fully Supported:**
```rust
trait T {
    async fn foo() {}        // Not supported
    async fn bar(&self) {}   // Not supported
}
```

**Workarounds:**
1. Use `async-trait` crate
2. Return `impl Future` manually
3. Wait for native trait async support

```rust
// Workaround with impl Future
trait T {
    fn foo(&self) -> impl Future<Output = ()> + '_;
}
```

---

## Common Async Patterns

### Awaiting Futures

```rust
async fn fetch_data() -> String {
    // Simulated async operation
    "data".to_string()
}

async fn process() {
    let data = fetch_data().await;
    println!("Received: {}", data);
}
```

### Multiple Concurrent Operations

```rust
use tokio::join;

async fn task1() -> u32 { 1 }
async fn task2() -> u32 { 2 }

async fn run_parallel() {
    let (result1, result2) = join!(task1(), task2());
    println!("Results: {} and {}", result1, result2);
}
```

### Error Handling

```rust
async fn may_fail() -> Result<String, std::io::Error> {
    // Async operation that can fail
    Ok("success".to_string())
}

async fn handle_errors() {
    match may_fail().await {
        Ok(data) => println!("Success: {}", data),
        Err(e) => eprintln!("Error: {}", e),
    }
}
```

---

## Async Runtime

### Tokio (Most Common)

```rust
#[tokio::main]
async fn main() {
    let result = fetch_data().await;
    println!("{}", result);
}
```

### async-std Alternative

```rust
#[async_std::main]
async fn main() {
    let result = fetch_data().await;
    println!("{}", result);
}
```

---

## Best Practices

1. **Explicit Lifetimes**: Use explicit types instead of `Self` in async returns
2. **Trait Bounds**: Understand how `AsyncFn` traits affect captures
3. **Error Types**: Use `Result<T, E>` for fallible async operations
4. **Runtime Choice**: Pick Tokio or async-std based on ecosystem
5. **Blocking Code**: Never block the async executor
6. **Spawning Tasks**: Use `tokio::spawn` for concurrent tasks

---

## Common Issues

### Issue: Self in Async Return Types
**Problem:** `async fn` returning `Self` with lifetimes
**Solution:** Explicitly write `S<'a>` instead of `Self`

### Issue: Async in Traits
**Problem:** Native async fn in traits not fully supported
**Solution:** Use `async-trait` crate or return `impl Future`

### Issue: Move vs Borrow in Closures
**Problem:** Unexpected ownership behavior
**Solution:** Understand trait bounds (`AsyncFn` vs `AsyncFnOnce`)

---

## Async Trait Hierarchy

```
AsyncFn       - Can be called multiple times, borrows captures
AsyncFnMut    - Can be called multiple times, mutably borrows captures
AsyncFnOnce   - Called once, moves captures
```

---

## Quick Reference

| Concept | Syntax | Notes |
|---------|--------|-------|
| Async function | `async fn foo()` | Returns `impl Future` |
| Await | `.await` | Suspends until future completes |
| Explicit return | `async fn f() -> T` | T is the future's output |
| Desugared | `fn f() -> impl Future<Output=T>` | What async fn becomes |
| Async block | `async { ... }` | Creates future inline |
| Async closure | `async \|\| { ... }` | Async lambda |

---

## Dependencies

Common async crates:

```toml
[dependencies]
tokio = { version = "1", features = ["full"] }
async-trait = "0.1"
futures = "0.3"
```

---

## Example: Complete Async Application

```rust
use tokio::time::{sleep, Duration};

async fn fetch_user(id: u32) -> Result<String, String> {
    sleep(Duration::from_millis(100)).await;
    Ok(format!("User {}", id))
}

async fn fetch_posts(user: &str) -> Result<Vec<String>, String> {
    sleep(Duration::from_millis(150)).await;
    Ok(vec![
        format!("{}'s post 1", user),
        format!("{}'s post 2", user),
    ])
}

#[tokio::main]
async fn main() -> Result<(), String> {
    // Sequential
    let user = fetch_user(1).await?;
    let posts = fetch_posts(&user).await?;

    println!("User: {}", user);
    for post in posts {
        println!("  - {}", post);
    }

    // Parallel
    let (user1, user2) = tokio::join!(
        fetch_user(1),
        fetch_user(2)
    );

    println!("Fetched: {:?} and {:?}", user1, user2);

    Ok(())
}
```

---

## Resources

- **Async Book**: https://rust-lang.github.io/async-book/
- **Tokio Docs**: https://tokio.rs
- **async-trait**: https://github.com/dtolnay/async-trait
