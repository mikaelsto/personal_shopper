//! Every product's own page, p/<store>/<slug>-<id>.html (served without ".html", see vercel.json):
//! the start page's feed, starting with that product (pre-rendered, like the start page's first
//! products) and followed by more like it. Its head is what search engines and link previews
//! read: title, description, canonical link, Open Graph tags and schema.org Product data.
//! Plus sitemap.xml, listing the start page and every product page.

use crate::feed::Product;
use crate::names::clean_name;
use crate::prerender::{esc, sek, sizes_in_stock, slide, thumb};
use serde_json::json;
use std::fmt::Write;

pub const SITE: &str = "https://runnista.com";

/// productPath() in scripts/lib/feed.mjs: "loplabbet:156650213" -> "p/loplabbet/nike-alphafly-next-3-kolfiberskor-156650213".
pub fn product_path(p: &Product) -> String {
    let (store, rest) = p.id.split_once(':').unwrap_or((&p.id, ""));
    let file: String = rest.chars().map(|c| if c.is_ascii_alphanumeric() || c == '_' || c == '-' { c } else { '_' }).collect();
    let name = slug(&full_name(p), 70);
    if name.is_empty() { format!("p/{store}/{file}") } else { format!("p/{store}/{name}-{file}") }
}

/// slug() in scripts/lib/feed.mjs: lower case a-z, 0-9 and "-", Nordic and accented letters
/// folded, cut at a word to at most `max` characters.
pub fn slug(text: &str, max: usize) -> String {
    let mut s = String::new();
    for c in text.to_lowercase().chars().filter(|&c| c != '\'' && c != '’') {
        match c {
            'å' | 'ä' | 'á' | 'à' | 'â' | 'ã' => s.push('a'),
            'æ' => s.push_str("ae"),
            'ç' => s.push('c'),
            'é' | 'è' | 'ê' | 'ë' => s.push('e'),
            'í' | 'ì' | 'î' | 'ï' => s.push('i'),
            'ñ' => s.push('n'),
            'ö' | 'ø' | 'ó' | 'ò' | 'ô' | 'õ' => s.push('o'),
            'ß' => s.push_str("ss"),
            'ú' | 'ù' | 'û' | 'ü' => s.push('u'),
            c if c.is_ascii_lowercase() || c.is_ascii_digit() => s.push(c),
            _ => s.push('-'),
        }
    }
    let mut out = String::new();
    for part in s.split('-').filter(|x| !x.is_empty()) {
        if !out.is_empty() {
            out.push('-');
        }
        out.push_str(part);
    }
    if out.len() > max {
        let cut = &out[..max];
        out = match cut.rfind('-') {
            Some(i) if i > 0 => cut[..i].to_string(),
            _ => cut.to_string(),
        };
    }
    out
}

/// fullName() in scripts/lib/feed.mjs: "Nike Alphafly Next% 3", the clean name with the brand
/// in front, unless it's in it.
fn full_name(p: &Product) -> String {
    let title = clean_name(p);
    match p.brand.as_deref() {
        Some(b) if !b.is_empty() && !title.to_lowercase().contains(&b.to_lowercase()) => format!("{b} {title}"),
        _ => title,
    }
}

/// The store's own price and currency (EUR/USD stores), else SEK.
fn offer_price(p: &Product) -> (f64, &str) {
    match &p.local {
        Some(l) => (l.price, l.currency.as_str()),
        None => (p.price, "SEK"),
    }
}

fn price_text(p: &Product) -> String {
    let approx = if p.local.is_some() { "≈ " } else { "" };
    format!("{approx}{}", sek(p.price))
}

fn description(p: &Product) -> String {
    let mut d = format!("{} from {} for {}", full_name(p), p.store_name, price_text(p));
    if let Some(was) = p.compare_at.filter(|&c| c > p.price) {
        let _ = write!(d, " (was {}, −{}%)", sek(was), ((1.0 - p.price / was) * 100.0).round());
    }
    d.push_str(". ");
    let sizes = sizes_in_stock(p);
    if !p.available || sizes.is_empty() {
        d.push_str("Sold out right now. ");
    } else if sizes != ["One size"] {
        let shown: Vec<_> = sizes.iter().take(10).map(String::as_str).collect();
        let _ = write!(d, "In stock: {}{}. ", shown.join(", "), if sizes.len() > 10 { " and more" } else { "" });
    }
    d.push_str("Price history and more running gear from many stores on Runnista.");
    d
}

/// JSON for inside <script>: "</" can't end the element early.
fn script_json(v: &serde_json::Value) -> String {
    v.to_string().replace("</", "<\\/")
}

fn structured_data(p: &Product, url: &str) -> String {
    let (price, currency) = offer_price(p);
    let mut product = json!({
        "@context": "https://schema.org",
        "@type": "Product",
        "name": full_name(p),
        "url": url,
        "image": p.images_in_order().into_iter().take(4).collect::<Vec<_>>(),
        "sku": p.id.split_once(':').map_or(p.id.as_str(), |(_, id)| id),
        "offers": {
            "@type": "Offer",
            "url": p.url,
            "price": crate::feed::num(price),
            "priceCurrency": currency,
            "availability": if p.available { "https://schema.org/InStock" } else { "https://schema.org/OutOfStock" },
            "seller": { "@type": "Organization", "name": p.store_name },
        },
    });
    if let Some(b) = p.brand.as_deref().filter(|b| !b.is_empty()) {
        product["brand"] = json!({ "@type": "Brand", "name": b });
    }
    if let Some(d) = p.description.as_deref().map(str::trim).filter(|d| !d.is_empty()) {
        product["description"] = json!(d.chars().take(500).collect::<String>());
    }
    if p.colors.len() == 1 {
        product["color"] = json!(p.colors[0]);
    }
    script_json(&product)
}

/// The page's own head (title, description, canonical link, link previews, structured data).
fn head(p: &Product, path: &str) -> String {
    let url = format!("{SITE}/{path}");
    let name = full_name(p);
    let desc = description(p);
    let image = thumb(p.main_image().expect("product pages have a photo"), 1080);
    let (price, currency) = offer_price(p);
    let mut h = String::new();
    let _ = write!(
        h,
        r#"<title>{title}</title>
  <meta name="description" content="{desc}">
  <link rel="canonical" href="{url}">
  <meta name="product" content="{id}">
  <meta property="og:type" content="product">
  <meta property="og:site_name" content="Runnista">
  <meta property="og:title" content="{og_title}">
  <meta property="og:description" content="{desc}">
  <meta property="og:url" content="{url}">
  <meta property="og:image" content="{image}">
  <meta property="product:price:amount" content="{price}">
  <meta property="product:price:currency" content="{currency}">
  <meta name="twitter:card" content="summary_large_image">
"#,
        title = esc(&format!("{name} · {} at {} | Runnista", price_text(p), p.store_name)),
        og_title = esc(&format!("{name} · {}", price_text(p))),
        desc = esc(&desc),
        url = esc(&url),
        id = esc(&p.id),
        image = esc(&image),
        price = crate::feed::num(price),
        currency = esc(currency),
    );
    if let Some(host) = p.main_image().and_then(|i| i.split('/').nth(2)) {
        let _ = writeln!(h, r#"  <link rel="preconnect" href="https://{}">"#, esc(host));
    }
    let _ = write!(h, r#"  <script type="application/ld+json">{}</script>"#, structured_data(p, &url));
    h
}

/// (file under _site/, HTML) for every product with a photo, from the finished page template
/// (pages::product_template()).
pub fn pages(template: &str, products: &[Product], total: usize) -> Vec<(String, String)> {
    products
        .iter()
        .filter(|p| !p.images.is_empty())
        .map(|p| {
            let path = product_path(p);
            let html = template.replacen("<!--head-->", &head(p, &path), 1).replacen("<!--prerender-->", &slide(p, 0, total), 1);
            (format!("{path}.html"), html)
        })
        .collect()
}

pub fn sitemap(pages: &[(String, String)]) -> String {
    let mut xml = String::from("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");
    let _ = writeln!(xml, "<url><loc>{SITE}/</loc></url>");
    for (file, _) in pages {
        let _ = writeln!(xml, "<url><loc>{SITE}/{}</loc></url>", esc(file.trim_end_matches(".html")));
    }
    xml.push_str("</urlset>\n");
    xml
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn slugs_match_feed_mjs() {
        // slug() in scripts/lib/feed.mjs, run in Node.
        assert_eq!(slug("ALPHAFLY NEXT% 3 KOLFIBERSKOR Racer Blue/White-Atomic Pink", 70), "alphafly-next-3-kolfiberskor-racer-blue-white-atomic-pink");
        assert_eq!(slug("Women's Race Vest Print | Tropical Dot", 70), "womens-race-vest-print-tropical-dot");
        assert_eq!(slug("Löparskor Dam – Blå/Grön Æble Straße", 70), "loparskor-dam-bla-gron-aeble-strasse");
        assert_eq!(slug("  ---  ", 70), "");
        assert_eq!(slug("aaaa bbbb cccc", 11), "aaaa-bbbb");
        assert_eq!(slug("abcdefghijkl", 5), "abcde");
        assert_eq!(slug("日本 shoe", 70), "shoe");
    }

    #[test]
    fn json_in_script() {
        assert_eq!(script_json(&json!({ "d": "a</script>b" })), r#"{"d":"a<\/script>b"}"#);
    }
}
