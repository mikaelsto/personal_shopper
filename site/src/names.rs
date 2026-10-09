//! Clean product names for the feed: "SUPERNOVA RISE 3 LÖPARSKOR" -> "Supernova Rise 3".
//! Stores pad their titles with things the feed shows elsewhere: the brand (above the name),
//! Swedish product types (Löplabbet: "LÖPARSKOR", "KOLFIBERSKOR"), gender ("Dam", "Men's") and
//! the colour ("| Black", ", Cactus", "- Men - Black"). The name is written to feed.json only
//! where it differs from the store's title (which the details still show).

use crate::feed::Product;
use regex::Regex;
use std::sync::LazyLock;

static PRODUCT_TYPE: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"(?i)^(löpar\S*|kolfiber\S*|terräng\S*|tävlings\S*|\S*skor|sport-bh)$").unwrap());
static GENDER: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"(?i)^(dam|herr|unisex|junior|barn|men|women|men's|women's|mens|womens|m|w|u)$").unwrap());
static DIGIT: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"\d").unwrap());
static LETTERS: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"\p{L}+").unwrap());
/// Short all-caps words that are words, not abbreviations like GTX, SL or LS.
const SHORT_WORDS: &[&str] = &[
    "and", "the", "for", "of", "with", "in", "on", "to", "a", "tee", "bag", "cap", "top", "hat", "bra", "run", "zip", "fly", "one",
    "pro", "max", "air", "box", "low", "mid", "new", "dry", "sun", "fit", "rib", "net", "go", "all", "day",
];

pub fn clean_name(p: &Product) -> String {
    let mut t = p.title.split_whitespace().collect::<Vec<_>>().join(" ");
    let colour = p.colors.first().map(|c| c.to_lowercase());

    // "Name | Colour" (Soar)
    if let Some((name, _)) = t.rsplit_once(" | ") {
        t = name.to_string();
    }
    // "Name, Colour" (District Vision), only when it's the product's colour
    if let (Some((name, last)), Some(c)) = (t.rsplit_once(", "), &colour) {
        if last.to_lowercase() == *c {
            t = name.to_string();
        }
    }
    // "Name - Men - Colour" (ACT, Doxa, Bandit): the last part when it's a short word or two
    let mut parts: Vec<&str> = t.split(" - ").collect();
    if parts.len() > 1 && parts.last().is_some_and(|l| l.split_whitespace().count() <= 3 && !DIGIT.is_match(l)) {
        parts.pop();
    }
    parts.retain(|s| !GENDER.is_match(s.trim()));
    t = parts.join(" - ");

    // The brand in front ("Puma Run Velocity…"), shown above the name already
    if let Some(b) = p.brand.as_deref().map(str::trim).filter(|b| !b.is_empty()) {
        if t.len() > b.len() + 3 && t.is_char_boundary(b.len() + 1) && t[..b.len() + 1].to_lowercase() == format!("{} ", b.to_lowercase()) {
            t = t[b.len() + 1..].to_string();
        }
    }
    let mut words: Vec<&str> = t.split(' ').collect();
    while words.len() > 1 && words.last().is_some_and(|w| PRODUCT_TYPE.is_match(w) || GENDER.is_match(w)) {
        words.pop();
    }
    while words.len() > 1 && GENDER.is_match(words[0]) {
        words.remove(0);
    }
    let t = words.join(" ");
    let t = t.trim_matches(|c: char| c == ' ' || c == '-' || c == '–' || c == '|' || c == ',');
    if t.is_empty() { p.title.trim().to_string() } else { title_case(t) }
}

/// "FOREVERRUN NITRO 3 GTX" -> "Foreverrun Nitro 3 GTX"; titles that aren't (nearly) all
/// capitals stay as they are.
fn title_case(t: &str) -> String {
    let letters: Vec<char> = t.chars().filter(|c| c.is_alphabetic()).collect();
    if letters.is_empty() || (letters.iter().filter(|c| c.is_uppercase()).count() as f64) < letters.len() as f64 * 0.8 {
        return t.to_string();
    }
    t.split(' ')
        .map(|w| {
            let core: String = w.chars().filter(|c| c.is_alphabetic()).collect();
            let n = core.chars().count();
            let abbreviation = (2..=3).contains(&n)
                && core.chars().all(char::is_uppercase)
                && !DIGIT.is_match(w)
                && !SHORT_WORDS.contains(&core.to_lowercase().as_str());
            if abbreviation {
                w.to_string()
            } else {
                LETTERS
                    .replace_all(w, |c: &regex::Captures| {
                        let mut chars = c[0].chars();
                        let first = chars.next().unwrap();
                        first.to_uppercase().chain(chars.flat_map(char::to_lowercase)).collect::<String>()
                    })
                    .into_owned()
            }
        })
        .collect::<Vec<_>>()
        .join(" ")
}

#[cfg(test)]
mod tests {
    use super::*;

    fn product(title: &str, brand: &str, colors: &[&str]) -> Product {
        serde_json::from_value(serde_json::json!({
            "id": "x:1", "store": "x", "storeName": "X", "storeBase": "", "title": title, "brand": brand, "url": "",
            "category": "", "subcategory": "", "gender": "", "price": 1.0, "available": true, "colors": colors,
        }))
        .unwrap()
    }

    #[test]
    fn names() {
        let n = |t: &str, b: &str, c: &[&str]| clean_name(&product(t, b, c));
        assert_eq!(n("SUPERNOVA RISE 3 LÖPARSKOR", "adidas", &["Lucpnk/Purbur/Blilil"]), "Supernova Rise 3");
        assert_eq!(n("ALPHAFLY NEXT% 3 KOLFIBERSKOR", "Nike", &[]), "Alphafly Next% 3");
        assert_eq!(n("GHOST 17 NARROW GTX LÖPARSKOR", "Brooks", &[]), "Ghost 17 Narrow GTX");
        assert_eq!(n("Puma Run Velocity Långärmad tröja Dam", "Puma", &["Svart"]), "Run Velocity Långärmad tröja");
        assert_eq!(n("Men's Race Vest 2.0 Print | Black/Yellow Dot", "Soar Running", &[]), "Race Vest 2.0 Print");
        assert_eq!(n("7in Pocketed Half-Tights, Cactus", "DV", &["Cactus"]), "7in Pocketed Half-Tights");
        assert_eq!(n("Lightweight Tee, Long Sleeve", "DV", &["Black"]), "Lightweight Tee, Long Sleeve");
        assert_eq!(n("ShellLight - 2-in-1 Shorts - Men's - Dusty Rose", "ACT", &[]), "ShellLight - 2-in-1 Shorts");
        assert_eq!(n("MENS RERUN TEE SS - Taupe", "Doxa", &[]), "Rerun Tee SS");
        assert_eq!(n("L/S RUNNING TOP", "UVU", &[]), "L/S Running Top");
        assert_eq!(n("UVU CAP", "UVU", &[]), "Cap");
        assert_eq!(n("TEMPO SHORTS W", "Satisfy", &[]), "Tempo Shorts");
        assert_eq!(n("Grid Knit™ Run Socks - White / Vintage Blue (2 Pack)", "Bandit", &[]), "Grid Knit™ Run Socks - White / Vintage Blue (2 Pack)");
        assert_eq!(n("LÖPARSKOR", "X", &[]), "Löparskor"); // nothing left to strip
        assert_eq!(n("Åsunden Neck Gaiter Navy", "YMR", &[]), "Åsunden Neck Gaiter Navy");
    }
}
