//! The site's product data, built from data/products.json (format: scripts/lib/feed.mjs, which
//! decodes it in the browser):
//!
//!   feed.json                 every product as a compact row, with what slides, cards and filters need
//!   feed/<store>/<id>.json    one product's details, fetched when it's on screen or opened
//!   feed-search.json          words from each product's description, store category and materials
//!
//! feed.json shares repeated strings (brands, categories, sizes, colours, dates) through one
//! `words` table, most used first so the common ones get the shortest numbers, and stores links
//! and photos without the prefix they share within a store.

use serde::Deserialize;
use serde_json::{json, Map, Value};
use std::collections::HashMap;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProductsFile {
    pub generated_at: String,
    pub products: Vec<Product>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Product {
    pub id: String,
    pub store: String,
    pub store_name: String,
    pub store_base: String,
    pub cart: Option<String>,
    pub title: String,
    pub brand: Option<String>,
    pub brand_key: Option<String>,
    pub brand_line: Option<String>,
    pub url: String,
    pub product_type: Option<String>,
    pub category: String,
    pub subcategory: String,
    pub gender: String,
    #[serde(default)]
    pub features: Vec<String>,
    #[serde(default)]
    pub materials: Vec<String>,
    #[serde(default)]
    pub fabrics: Vec<String>,
    pub description: Option<String>,
    #[serde(default)]
    pub images: Vec<String>,
    pub price: f64,
    pub compare_at: Option<f64>,
    pub available: bool,
    pub local: Option<Local>,
    #[serde(default)]
    pub colors: Vec<String>,
    #[serde(default)]
    pub variants: Vec<Variant>,
    pub photo_color: Option<PhotoColor>,
    pub first_seen: Option<String>,
    pub last_seen: Option<String>,
    pub collected_at: Option<String>,
}

#[derive(Deserialize)]
pub struct Local {
    pub currency: String,
    pub price: f64,
}

#[derive(Deserialize)]
pub struct Variant {
    pub id: Option<Value>,
    pub size: Option<String>,
    pub color: Option<String>,
    #[serde(default)]
    pub available: bool,
}

#[derive(Deserialize)]
pub struct PhotoColor {
    pub main: Option<String>,
    pub name: Option<String>,
}

impl Product {
    pub fn is_cart(&self) -> bool {
        self.cart.as_deref() == Some("shopify")
    }
}

pub struct Built {
    pub feed: Value,
    /// (path under data/, JSON)
    pub details: Vec<(String, String)>,
    pub search: Value,
}

/// "kayo:16844" -> "feed/kayo/16844.json", as detailsPath() in scripts/lib/feed.mjs.
pub fn details_path(id: &str) -> String {
    let (store, rest) = id.split_once(':').unwrap_or((id, ""));
    let file: String = rest.chars().map(|c| if c.is_ascii_alphanumeric() || c == '_' || c == '-' { c } else { '_' }).collect();
    format!("feed/{store}/{file}.json")
}

/// Whole numbers without ".0", so prices stay as short as in the JS build.
pub fn num(n: f64) -> Value {
    if n.fract() == 0.0 && n.abs() < 9e15 {
        Value::from(n as i64)
    } else {
        Value::from(n)
    }
}

/// The prefix that saves the most bytes over a store's links (or photos): one ending in "/"
/// (before any "?"), weighed by how many start with it times its length.
fn common_prefix<'a>(urls: impl Iterator<Item = &'a str>) -> String {
    let mut counts: HashMap<&str, usize> = HashMap::new();
    for u in urls {
        let path = u.split('?').next().unwrap_or(u);
        for (i, _) in path.match_indices('/').skip(2) {
            *counts.entry(&u[..=i]).or_default() += 1;
        }
    }
    counts
        .into_iter()
        .max_by(|a, b| (a.1 * a.0.len()).cmp(&(b.1 * b.0.len())).then(b.0.cmp(a.0)))
        .map(|(p, _)| p.to_string())
        .unwrap_or_default()
}

fn strip<'a>(prefix: &str, url: &'a str) -> &'a str {
    match url.strip_prefix(prefix) {
        // A remainder that looks like a full link would be read as one.
        Some(rest) if !prefix.is_empty() && !rest.starts_with("http:") && !rest.starts_with("https:") => rest,
        _ => url,
    }
}

/// Each distinct word once, lower case, punctuation trimmed ("t-shirt" and "100%" stay whole).
fn search_words(text: &str) -> String {
    let lower = text.to_lowercase();
    let mut seen = std::collections::HashSet::new();
    let mut out: Vec<&str> = Vec::new();
    for w in lower.split_whitespace() {
        let w = w
            .trim_start_matches(|c: char| !c.is_alphanumeric())
            .trim_end_matches(|c: char| !(c.is_alphanumeric() || c == '%'));
        if w.chars().count() > 1 && seen.insert(w) {
            out.push(w);
        }
    }
    out.join(" ")
}

struct StoreInfo {
    id: String,
    name: String,
    base: String,
    cart: Option<String>,
    url: String,
    img: String,
}

/// Every string a product puts in the words table, in one place so counting and encoding agree.
fn encode_row(p: &Product, store_index: usize, s: &StoreInfo, w: &mut dyn FnMut(Option<&str>) -> u32) -> Result<Value, String> {
    let own_id = p
        .id
        .strip_prefix(&format!("{}:", p.store))
        .ok_or_else(|| format!("product id {:?} doesn't start with its store \"{}:\"", p.id, p.store))?;
    let list = |items: &[String], w: &mut dyn FnMut(Option<&str>) -> u32| -> Value {
        if items.is_empty() { Value::from(0) } else { Value::from(items.iter().map(|x| w(Some(x))).collect::<Vec<_>>()) }
    };
    let multi_colour = p.colors.len() > 1;
    let mut row = vec![
        Value::from(own_id),
        Value::from(store_index),
        Value::from(p.title.as_str()),
        Value::from(strip(&s.url, &p.url)),
        Value::from(p.images.first().map(|i| strip(&s.img, i)).unwrap_or("")),
        num(p.price),
        Value::from(p.available as u8),
        Value::from(w(p.brand.as_deref())),
        Value::from(w(p.brand_key.as_deref())),
        Value::from(w(Some(&p.category))),
        Value::from(w(Some(&p.subcategory))),
        Value::from(w(Some(&p.gender))),
        Value::from(w(p.first_seen.as_deref())),
        Value::from(p.colors.iter().map(|c| w(Some(c))).collect::<Vec<_>>()),
        Value::from(p.variants.iter().map(|v| w(v.size.as_deref())).collect::<Vec<_>>()),
        Value::from(p.variants.iter().map(|v| if v.available { '1' } else { '0' }).collect::<String>()),
        if multi_colour { Value::from(p.variants.iter().map(|v| w(v.color.as_deref())).collect::<Vec<_>>()) } else { Value::from(0) },
        list(&p.features, w),
        list(&p.fabrics, w),
        p.compare_at.map(num).unwrap_or(Value::from(0)),
        p.local.as_ref().map(|l| json!([w(Some(&l.currency)), num(l.price)])).unwrap_or(Value::from(0)),
        match &p.photo_color {
            Some(PhotoColor { main: Some(main), name }) => json!([main, w(name.as_deref())]),
            _ => Value::from(0),
        },
        Value::from(w(p.brand_line.as_deref())),
    ];
    // Optional fields at the end: leave out the empty ones.
    while row.len() > 16 && row.last() == Some(&Value::from(0)) {
        row.pop();
    }
    Ok(Value::from(row))
}

pub fn build(file: &ProductsFile, history: &Map<String, Value>, day: &str) -> Result<Built, String> {
    let products = &file.products;

    // Stores in order of appearance, with the prefixes their links and photos share.
    let mut order: Vec<&str> = Vec::new();
    let mut by_store: HashMap<&str, Vec<&Product>> = HashMap::new();
    for p in products {
        by_store.entry(&p.store).or_insert_with(|| {
            order.push(&p.store);
            Vec::new()
        }).push(p);
    }
    let stores: Vec<StoreInfo> = order
        .iter()
        .map(|id| {
            let list = &by_store[id];
            let first = list[0];
            StoreInfo {
                id: id.to_string(),
                name: first.store_name.clone(),
                base: first.store_base.clone(),
                cart: first.cart.clone(),
                url: common_prefix(list.iter().map(|p| p.url.as_str())),
                img: common_prefix(list.iter().filter_map(|p| p.images.first().map(String::as_str))),
            }
        })
        .collect();
    let store_index: HashMap<&str, usize> = order.iter().enumerate().map(|(i, id)| (*id, i)).collect();

    // Pass 1 counts the words, pass 2 encodes with the most used ones first.
    let mut counts: HashMap<String, u32> = HashMap::new();
    for p in products {
        let si = store_index[p.store.as_str()];
        encode_row(p, si, &stores[si], &mut |s| {
            if let Some(s) = s {
                *counts.entry(s.to_string()).or_default() += 1;
            }
            0
        })?;
    }
    let mut words: Vec<(String, u32)> = counts.into_iter().collect();
    words.sort_by(|a, b| b.1.cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
    let index: HashMap<&str, u32> = words.iter().enumerate().map(|(i, (s, _))| (s.as_str(), i as u32 + 1)).collect();

    let mut rows = Vec::with_capacity(products.len());
    let mut details = Vec::with_capacity(products.len());
    let mut search = Map::new();
    for p in products {
        let si = store_index[p.store.as_str()];
        rows.push(encode_row(p, si, &stores[si], &mut |s| s.map_or(0, |s| index[s]))?);

        let mut d = Map::new();
        d.insert("id".into(), Value::from(p.id.as_str()));
        if let Some(desc) = p.description.as_deref().filter(|d| !d.is_empty()) {
            d.insert("description".into(), Value::from(desc));
        }
        if !p.materials.is_empty() {
            d.insert("materials".into(), json!(p.materials));
        }
        if p.images.len() > 1 {
            d.insert("images".into(), json!(p.images[1..]));
        }
        if let Some(h) = history.get(&p.id) {
            d.insert("history".into(), h.clone());
        }
        if let Some(seen) = p.last_seen.as_ref().or(p.collected_at.as_ref()) {
            d.insert("lastSeen".into(), Value::from(seen.as_str()));
        }
        if p.is_cart() {
            d.insert("variantIds".into(), Value::from(p.variants.iter().map(|v| v.id.clone().unwrap_or(Value::Null)).collect::<Vec<_>>()));
        }
        details.push((details_path(&p.id), Value::Object(d).to_string()));

        let text = format!("{} {} {}", p.product_type.as_deref().unwrap_or(""), p.materials.join(" "), p.description.as_deref().unwrap_or(""));
        search.insert(p.id.clone(), Value::from(search_words(&text)));
    }

    let mut word_list = vec![Value::Null];
    word_list.extend(words.into_iter().map(|(s, _)| Value::from(s)));
    let feed = json!({
        "v": 2,
        "generatedAt": file.generated_at,
        "day": day,
        "stores": stores.iter().map(|s| json!({ "id": s.id, "name": s.name, "base": s.base, "cart": s.cart, "url": s.url, "img": s.img })).collect::<Vec<_>>(),
        "words": word_list,
        "products": rows,
    });
    Ok(Built { feed, details, search: Value::Object(search) })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn details_paths_match_the_browser() {
        assert_eq!(details_path("kayo:16844"), "feed/kayo/16844.json");
        assert_eq!(details_path("passasports:a/b c:d"), "feed/passasports/a_b_c_d.json");
    }

    #[test]
    fn search_words_trim_and_dedupe() {
        assert_eq!(search_words("100% Merino, merino T-shirt! a (wool)"), "100% merino t-shirt wool");
    }

    #[test]
    fn prefixes_are_stripped_only_when_shared() {
        let p = common_prefix(["https://x.se/products/a", "https://x.se/products/b?v=1", "https://y.se/c"].into_iter());
        assert_eq!(p, "https://x.se/products/");
        assert_eq!(strip(&p, "https://x.se/products/a"), "a");
        assert_eq!(strip(&p, "https://y.se/c"), "https://y.se/c");
    }
}
