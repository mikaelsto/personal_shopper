//! Builds Runnista's static site for GitHub Pages into _site/:
//!
//!   web/*                    -> _site/            index.html (the feed) gets its first products
//!                                                 pre-rendered, its CSS inline and preloads
//!   data/*.json (public)     -> _site/data/
//!   scripts/lib (browser)    -> _site/lib/        shared taxonomy, colours, palettes, feed decoder
//!   slim product data        -> _site/data/feed.json, feed/<store>/<id>.json, feed-search.json
//!
//! `npm run build`, or `cargo run --release --manifest-path site/Cargo.toml` from the repo root.

mod feed;
mod pages;
mod prerender;

use std::{
    env, fs,
    path::{Path, PathBuf},
    time::{Instant, SystemTime, UNIX_EPOCH},
};

const DATA_FILES: &[&str] = &["products.json", "price-history.json", "meta.json", "stores.json", "color-names.json"];
const BROWSER_LIBS: &[&str] = &[
    "normalize.mjs", "brands.mjs", "taxonomy.mjs", "shopify-map.mjs", "colors.mjs", "palettes.mjs", "palette-match.mjs", "feed.mjs",
];
/// Products pre-rendered into the start page.
const PRERENDER: usize = 3;

type Result<T> = std::result::Result<T, Box<dyn std::error::Error>>;

fn main() -> Result<()> {
    let started = Instant::now();
    let root = Path::new(env!("CARGO_MANIFEST_DIR")).parent().unwrap().to_path_buf();
    let out = root.join("_site");
    let now = SystemTime::now().duration_since(UNIX_EPOCH)?;
    // Cache-busting: GitHub Pages lets browsers cache files for 10 minutes, so after a deploy a
    // new page could run with the previous CSS/JS. Every local CSS/JS reference gets the build.
    let version: String = match env::var("GITHUB_SHA") {
        Ok(sha) if !sha.is_empty() => sha.chars().take(10).collect(),
        _ => base36(now.as_millis() as u64),
    };
    let day = utc_date(now.as_secs());

    if out.exists() {
        fs::remove_dir_all(&out)?;
    }
    fs::create_dir_all(out.join("data/feed"))?;
    fs::create_dir_all(out.join("lib"))?;
    copy_dir(&root.join("web"), &out)?;
    for f in DATA_FILES {
        fs::copy(root.join("data").join(f), out.join("data").join(f))?;
    }
    for f in BROWSER_LIBS {
        fs::copy(root.join("scripts/lib").join(f), out.join("lib").join(f))?;
    }

    // Product data
    let products: feed::ProductsFile = serde_json::from_slice(&fs::read(root.join("data/products.json"))?)?;
    let history: serde_json::Map<String, serde_json::Value> = serde_json::from_slice(&fs::read(root.join("data/price-history.json"))?)?;
    let built = feed::build(&products, &history, &day)?;
    let feed_json = built.feed.to_string();
    fs::write(out.join("data/feed.json"), &feed_json)?;
    fs::write(out.join("data/feed-search.json"), built.search.to_string())?;
    write_details(&out.join("data"), &built.details)?;

    // Pages
    let hidden_depts = pages::hidden_departments(&fs::read_to_string(root.join("scripts/lib/taxonomy.mjs"))?);
    let default_feed = prerender::default_feed(&products.products, &day, &hidden_depts);
    let first = prerender::render(&default_feed, PRERENDER);
    pages::finish(&out, &version, &first)?;

    println!(
        "Site built in {} in {:.2}s (v={version}, day {day}): {} products, feed.json {} KB, {} pre-rendered of {} in the default feed",
        out.display(),
        started.elapsed().as_secs_f64(),
        products.products.len(),
        feed_json.len() / 1024,
        PRERENDER.min(default_feed.len()),
        default_feed.len(),
    );
    Ok(())
}

fn copy_dir(from: &Path, to: &Path) -> Result<()> {
    fs::create_dir_all(to)?;
    for entry in fs::read_dir(from)? {
        let entry = entry?;
        let name = entry.file_name();
        if name == ".DS_Store" {
            continue;
        }
        let target = to.join(&name);
        if entry.file_type()?.is_dir() {
            copy_dir(&entry.path(), &target)?;
        } else {
            fs::copy(entry.path(), target)?;
        }
    }
    Ok(())
}

/// ~16 000 small files: written from all cores.
fn write_details(data: &Path, details: &[(String, String)]) -> Result<()> {
    let mut dirs: Vec<PathBuf> = details.iter().filter_map(|(path, _)| data.join(path).parent().map(Path::to_path_buf)).collect();
    dirs.sort();
    dirs.dedup();
    for d in &dirs {
        fs::create_dir_all(d)?;
    }
    let threads = std::thread::available_parallelism().map_or(4, |n| n.get());
    let chunk = details.len().div_ceil(threads).max(1);
    std::thread::scope(|s| {
        let handles: Vec<_> = details
            .chunks(chunk)
            .map(|part| s.spawn(move || part.iter().try_for_each(|(path, json)| fs::write(data.join(path), json))))
            .collect();
        handles.into_iter().try_for_each(|h| h.join().expect("writer thread panicked"))
    })?;
    Ok(())
}

fn base36(mut n: u64) -> String {
    let digits = b"0123456789abcdefghijklmnopqrstuvwxyz";
    let mut out = Vec::new();
    loop {
        out.push(digits[(n % 36) as usize]);
        n /= 36;
        if n == 0 {
            break;
        }
    }
    out.reverse();
    String::from_utf8(out).unwrap()
}

/// "YYYY-MM-DD" in UTC, like new Date().toISOString().slice(0, 10).
fn utc_date(secs: u64) -> String {
    // Howard Hinnant's civil_from_days.
    let z = (secs / 86_400) as i64 + 719_468;
    let era = z.div_euclid(146_097);
    let doe = z - era * 146_097;
    let yoe = (doe - doe / 1460 + doe / 36_524 - doe / 146_096) / 365;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    let y = yoe + era * 400 + i64::from(m <= 2);
    format!("{y:04}-{m:02}-{d:02}")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn dates() {
        assert_eq!(utc_date(0), "1970-01-01");
        assert_eq!(utc_date(1_791_590_400), "2026-10-10");
        assert_eq!(utc_date(951_782_400), "2000-02-29");
    }
}
