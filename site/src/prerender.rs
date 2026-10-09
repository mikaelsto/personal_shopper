//! The start page's first products, rendered at build time so a phone shows a product before
//! any script or data has loaded. They're the first slides of the default feed (no filters, in
//! the day's order) with the same markup as slideHtml() in web/feed.js, minus what needs the
//! browser: colour dots, ♥ state and the details pane. When the feed has loaded, rebuild() in
//! feed.js replaces them and keeps their photos.

use crate::feed::Product;
use regex::Regex;
use std::sync::LazyLock;

const ICON_MENU: &str = r#"<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>"#;
const ICON_LEFT: &str = r#"<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>"#;
const ICON_HEART: &str = r#"<svg class="heart" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7.5-4.6-9.3-9.2C1.4 7.4 3.6 4 7 4c2.1 0 3.6 1.2 5 3 1.4-1.8 2.9-3 5-3 3.4 0 5.6 3.4 4.3 6.8C19.5 15.4 12 20 12 20z"/></svg>"#;

pub struct Prerendered {
    pub html: String,
    /// The photos' hosts, to connect to early.
    pub hosts: Vec<String>,
}

/// FNV-1a over UTF-16 code units, as hash() in web/feed.js: the feed's daily order.
pub fn order_hash(s: &str) -> u32 {
    s.encode_utf16().fold(2166136261u32, |h, c| (h ^ c as u32).wrapping_mul(16777619))
}

/// The default feed: in stock, with a photo, not in a department hidden from "Everything",
/// shuffled by the day.
pub fn default_feed<'a>(products: &'a [Product], day: &str, hidden_depts: &[String]) -> Vec<&'a Product> {
    let mut list: Vec<(&Product, u32)> = products
        .iter()
        .filter(|p| p.available && !p.images.is_empty() && !hidden_depts.contains(&p.category))
        .map(|p| (p, order_hash(&format!("{day} {}", p.id))))
        .collect();
    list.sort_by_key(|&(_, h)| h); // stable, like Array.prototype.sort
    list.into_iter().map(|(p, _)| p).collect()
}

pub fn render(feed: &[&Product], count: usize) -> Prerendered {
    let total = feed.len();
    let html = feed.iter().take(count).enumerate().map(|(i, p)| slide(p, i, total)).collect();
    let mut hosts: Vec<String> = Vec::new();
    for p in feed.iter().take(6) {
        if let Some(host) = p.images[0].split('/').nth(2) {
            let origin = format!("https://{host}");
            if !hosts.contains(&origin) {
                hosts.push(origin);
            }
        }
    }
    Prerendered { html, hosts }
}

fn slide(p: &Product, i: usize, total: usize) -> String {
    let title = display_title(p);
    let pos = format!("{} / {total}", i + 1);
    let img = &p.images[0];
    let srcset = srcset(img);
    let srcset = if srcset.is_empty() { String::new() } else { format!(r#" srcset="{}" sizes="(min-width: 900px) 57vw, 100vw""#, esc(&srcset)) };
    let load = if i < 2 { r#"fetchpriority="high""# } else { r#"loading="lazy""# };
    format!(
        r#"<article class="slide" data-pre data-id="{id}" aria-roledescription="product" aria-label="{title}, {pos}"><div class="pager"><section class="pane media"><a class="shot" href="{url}" target="_blank" rel="noopener" draggable="false" title="To the product page at {store}"><img src="{src}"{srcset} alt="{title}" draggable="false" {load}></a><span class="pos" aria-hidden="true">{pos}</span><button class="peek" data-action="details" aria-label="Product details">{ICON_LEFT}</button><button class="save" aria-pressed="false" aria-label="Save to your saved products">{ICON_HEART}</button><div class="caption"><p class="who"><span class="store-tag">{store}</span>{brand}</p><h2 class="title">{title}</h2><p class="price-row">{price}</p><p class="meta"><span class="stock">{stock}</span></p></div>{footer}</section></div></article>"#,
        id = esc(&p.id),
        title = esc(&title),
        url = esc(&p.url),
        store = esc(&p.store_name),
        src = esc(&thumb(img, 1080)),
        brand = esc(p.brand.as_deref().unwrap_or("")),
        price = price_html(p),
        stock = stock_sizes(p, 8),
        footer = FOOTER.as_str(),
    )
}

/// The photo's footer with no filters chosen, as footerHtml() in web/feed.js.
static FOOTER: LazyLock<String> = LazyLock::new(|| {
    let pill = |tab: &str, text: &str| format!(r#"<button class="pill" data-sheet="{tab}"><span>{text}</span></button>"#);
    format!(
        r#"<footer class="bar"><button class="menu" data-sheet="" aria-label="Open navigation: saved, colours, categories and sizes">{ICON_MENU}</button><button class="saved-btn" data-sheet="saved" aria-label="Saved products">{ICON_HEART}</button>{}{}{}</footer>"#,
        pill("colours", "Colours"),
        pill("categories", "Categories"),
        pill("sizes", "Sizes"),
    )
});

pub fn esc(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for c in s.chars() {
        match c {
            '&' => out.push_str("&amp;"),
            '<' => out.push_str("&lt;"),
            '>' => out.push_str("&gt;"),
            '"' => out.push_str("&quot;"),
            '\'' => out.push_str("&#39;"),
            _ => out.push(c),
        }
    }
    out
}

/// Math.round(n).toLocaleString('sv-SE'): groups of three with no-break spaces.
fn sv_int(n: f64) -> String {
    let digits = ((n + 0.5).floor() as i64).to_string();
    let mut out = String::new();
    for (i, c) in digits.chars().enumerate() {
        if i > 0 && (digits.len() - i) % 3 == 0 {
            out.push('\u{a0}');
        }
        out.push(c);
    }
    out
}

fn sek(n: f64) -> String {
    format!("{} kr", sv_int(n))
}

fn display_title(p: &Product) -> String {
    if p.colors.len() == 1 { format!("{} – {}", p.title, p.colors[0]) } else { p.title.clone() }
}

fn is_shopify(url: &str) -> bool {
    url.contains("cdn.shopify.com")
}

/// thumb() in web/shop-utils.js.
fn thumb(url: &str, w: u32) -> String {
    if is_shopify(url) {
        format!("{url}{}width={w}", if url.contains('?') { '&' } else { '?' })
    } else if url.contains("images.ka-yo.com/product/1000f1239/") && w <= 500 {
        url.replace("/1000f1239/", "/300f371/")
    } else {
        url.to_string()
    }
}

/// srcset() in web/shop-utils.js.
fn srcset(url: &str) -> String {
    if !is_shopify(url) {
        return String::new();
    }
    [540, 828, 1080, 1440].iter().map(|&w| format!("{} {w}w", thumb(url, w))).collect::<Vec<_>>().join(", ")
}

fn price_html(p: &Product) -> String {
    let approx = if p.local.is_some() { "≈ " } else { "" };
    match p.compare_at.filter(|&c| c > 0.0) {
        None => format!(r#"<span class="price">{approx}{}</span>"#, sek(p.price)),
        Some(was) => format!(
            r#"<span class="price sale">{approx}{}</span><s>{}</s><span class="off">−{}%</span>"#,
            sek(p.price),
            sek(was),
            ((1.0 - p.price / was) * 100.0 + 0.5).floor()
        ),
    }
}

static LETTER: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"\b(XXS|XS|S|M|L|XL|XXL|2XL|3XL)\b").unwrap());
static EU: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"EU\s*[\d½⅓⅔.,]+").unwrap());
static SPACES: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"\s+").unwrap());
static ONE_SIZE: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"(?i)^(one ?size|os|no size)$").unwrap());

/// sizeLetter() in web/shop-utils.js: "Size 1 (S)" or "Medium" -> "M".
fn size_letter(s: &str) -> Option<String> {
    let upper = s.to_uppercase();
    if let Some(m) = LETTER.captures(&upper) {
        return Some(if &m[1] == "2XL" { "XXL".into() } else { m[1].to_string() });
    }
    match upper.trim() {
        "SMALL" => Some("S".into()),
        "MEDIUM" => Some("M".into()),
        "LARGE" => Some("L".into()),
        _ => None,
    }
}

/// shortSize() in web/shop-utils.js: "US M8 / UK 7½ / EU 41⅓" -> "EU 41⅓".
fn short_size(s: &str) -> String {
    size_letter(s)
        .or_else(|| EU.find(s).map(|m| SPACES.replace(m.as_str(), " ").into_owned()))
        .unwrap_or_else(|| s.to_string())
}

/// Sizes in stock: "S · M · L" (stockSizesHtml() in web/feed.js, without "your sizes").
fn stock_sizes(p: &Product, max: usize) -> String {
    let mut sizes: Vec<String> = Vec::new();
    for v in p.variants.iter().filter(|v| v.available) {
        let s = match v.size.as_deref() {
            Some(size) if !size.is_empty() && !ONE_SIZE.is_match(size) => short_size(size),
            _ => "One size".into(),
        };
        if !sizes.contains(&s) {
            sizes.push(s);
        }
    }
    let mut out = sizes.iter().take(max).map(|s| esc(s)).collect::<Vec<_>>().join(" · ");
    if sizes.len() > max {
        out.push_str(&format!(" · +{}", sizes.len() - max));
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn order_hash_matches_feed_js() {
        // hash() in web/feed.js, run in Node.
        assert_eq!(order_hash("2026-10-09 satisfy:123"), 2065497550);
        assert_eq!(order_hash("2026-10-09 löplabbet:ö"), 1237333513);
        assert_eq!(order_hash("a😀"), 479120377);
    }

    #[test]
    fn swedish_numbers() {
        assert_eq!(sv_int(857.0), "857");
        assert_eq!(sv_int(1234.5), "1\u{a0}235");
        assert_eq!(sv_int(1234567.0), "1\u{a0}234\u{a0}567");
    }

    #[test]
    fn sizes() {
        assert_eq!(short_size("Size 1 (S)"), "S");
        assert_eq!(short_size("Medium"), "M");
        assert_eq!(short_size("2XL"), "XXL");
        assert_eq!(short_size("US M8 / UK 7½ / EU 41⅓"), "EU 41⅓");
        assert_eq!(short_size("EU42"), "EU42");
        assert_eq!(short_size("42"), "42");
    }
}
