//! Finishes the copied pages in _site/ so they load fast on a phone:
//!
//! - the start page (index.html) gets its first products pre-rendered (prerender.rs) and a
//!   preload for feed.json, plus early connections to the photo hosts
//! - stylesheets marked `data-inline` are put inline (one request less before the first paint)
//! - every module script's imports, also the nested ones, get a `modulepreload`, so the browser
//!   fetches them all at once instead of one level at a time
//! - every local CSS/JS reference and import gets `?v=<build>` (cache-busting)
//!
//! It also makes the template for the product pages (product.rs) from the start page.

use crate::prerender::Prerendered;
use regex::{Captures, Regex};
use std::{
    collections::HashSet,
    fs,
    path::{Component, Path, PathBuf},
    sync::LazyLock,
};

static MODULE_SCRIPT: LazyLock<Regex> = LazyLock::new(|| Regex::new(r#"<script type="module" src="([^"]+)"></script>"#).unwrap());
static IMPORT: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r#"(?:from\s*|import\s*\(\s*|import\s+)['"](\.{1,2}/[^'"?]+)['"]"#).unwrap());
static INLINE_CSS: LazyLock<Regex> = LazyLock::new(|| Regex::new(r#"<link rel="stylesheet" href="([^"]+)" data-inline>"#).unwrap());
static STAMP_REF: LazyLock<Regex> = LazyLock::new(|| Regex::new(r#"((?:href|src)=")([\w./-]+\.(?:css|m?js))""#).unwrap());
static STAMP_IMPORT: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r#"((?:from\s*|import\s*\(\s*)['"])(\.{1,2}/[^'"?]+\.m?js)(['"])"#).unwrap());

/// Departments marked `hidden: true` in scripts/lib/taxonomy.mjs (left out of "Everything").
pub fn hidden_departments(taxonomy: &str) -> Vec<String> {
    let re = Regex::new(r"\{\s*id:\s*'([\w-]+)'[^\n]*hidden:\s*true").unwrap();
    re.captures_iter(taxonomy).map(|c| c[1].to_string()).collect()
}

/// The start page's link preview and canonical address (product pages have their own). Every
/// market serves the same page, so they all name the Swedish one (product::CANONICAL).
const HOME_HEAD: &str = r#"  <link rel="canonical" href="https://runnista.com/en-se/">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Runnista">
  <meta property="og:title" content="Runnista – running gear from many stores, one swipe at a time">
  <meta property="og:description" content="Running and fashion apparel from many stores, one product per screen.">
  <meta property="og:url" content="https://runnista.com/en-se/">
  <meta property="og:image" content="https://runnista.com/icon-512.png">
"#;

pub fn finish(out: &Path, version: &str, first: &Prerendered) -> crate::Result<()> {
    let files = list_files(out)?;
    for file in files.iter().filter(|f| f.extension().is_some_and(|e| e == "html")) {
        let dir = file.parent().unwrap();
        let mut html = fs::read_to_string(file)?;
        let mut head = format!("<meta name=\"build\" content=\"{version}\">\n");

        if file == &out.join("index.html") {
            html = html.replacen("<!--prerender-->", &first.html, 1).replacen("<!--stores-->", &first.stores, 1).replacen("<!--pieces-->", &first.pieces, 1);
            head += HOME_HEAD;
            head += &format!("  <link rel=\"preload\" href=\"data/feed.json?v={version}\" as=\"fetch\" crossorigin>\n");
            for host in &first.hosts {
                head += &format!("  <link rel=\"preconnect\" href=\"{host}\">\n");
            }
        }

        html = finish_html(html, dir, head)?;
        fs::write(file, html)?;
    }

    for file in files.iter().filter(|f| f.extension().is_some_and(|e| e == "html" || e == "js" || e == "mjs")) {
        let text = fs::read_to_string(file)?;
        let stamped = stamp(&text, version);
        if stamped != text {
            fs::write(file, stamped)?;
        }
    }
    Ok(())
}

/// The product pages' template, from the start page's source (web/index.html) and the copied
/// scripts in `out`: `<base href="../../">` (the pages sit in <market>/p/<store>/, so that's the
/// market's start page, see vercel.json), the stylesheet linked
/// instead of inline (one cached file instead of ~20 KB in each of ~16 000 pages), and
/// `<!--head-->` (title, description, previews) and `<!--prerender-->` (the product) to fill in.
/// The opening card (#intro) is left out: you came for the product.
pub fn product_template(index_src: &str, out: &Path, version: &str) -> crate::Result<String> {
    let mut html = index_src.to_string();
    for (from, to) in [
        ("<meta charset=\"utf-8\">", "<meta charset=\"utf-8\">\n  <base href=\"../../\">"),
        ("<title>Runnista</title>", "<!--head-->"),
        (" data-inline>", ">"),
    ] {
        if !html.contains(from) {
            return Err(format!("web/index.html no longer has {from} (needed for the product pages)").into());
        }
        html = html.replacen(from, to, 1);
    }
    html = Regex::new(r#"\s*<meta name="description"[^>]*>"#).unwrap().replace(&html, "").into_owned();
    html = Regex::new(r"(?s)<!--intro-->.*<!--/intro-->").unwrap().replace(&html, "").into_owned(); // no opening card
    if !html.contains("<!--prerender-->") {
        return Err("web/index.html no longer has <!--prerender--> (needed for the product pages)".into());
    }
    let head = format!(
        "<meta name=\"build\" content=\"{version}\">\n  <link rel=\"preload\" href=\"data/feed.json?v={version}\" as=\"fetch\" crossorigin>\n"
    );
    Ok(stamp(&finish_html(html, out, head)?, version))
}

/// Module preloads and inline CSS for a page in `dir`, and `head` added to its head.
fn finish_html(mut html: String, dir: &Path, mut head: String) -> crate::Result<String> {
    for c in MODULE_SCRIPT.captures_iter(&html) {
        let mut seen = HashSet::new();
        module_graph(&normalize(&dir.join(&c[1])), &mut seen)?;
        let mut modules: Vec<_> = seen.into_iter().filter_map(|m| m.strip_prefix(dir).ok().map(Path::to_path_buf)).collect();
        modules.sort();
        for m in modules {
            head += &format!("  <link rel=\"modulepreload\" href=\"{}\">\n", m.to_string_lossy());
        }
    }

    let mut inline_err = None;
    html = INLINE_CSS
        .replace_all(&html, |c: &Captures| match fs::read_to_string(dir.join(&c[1])) {
            Ok(css) => format!("<style>{}</style>", minify_css(&css)),
            Err(e) => {
                inline_err = Some(e);
                String::new()
            }
        })
        .into_owned();
    if let Some(e) = inline_err {
        return Err(e.into());
    }

    Ok(html.replacen("</head>", &format!("  {head}</head>"), 1))
}

/// `?v=<build>` on every local CSS/JS reference and import.
fn stamp(text: &str, version: &str) -> String {
    let stamped = STAMP_REF.replace_all(text, format!("${{1}}${{2}}?v={version}\""));
    STAMP_IMPORT.replace_all(&stamped, format!("${{1}}${{2}}?v={version}${{3}}")).into_owned()
}

/// Every module `entry` imports, directly or through others (including `entry`).
fn module_graph(entry: &Path, seen: &mut HashSet<PathBuf>) -> crate::Result<()> {
    if !seen.insert(entry.to_path_buf()) {
        return Ok(());
    }
    let source = fs::read_to_string(entry).map_err(|e| format!("{}: {e}", entry.display()))?;
    let dir = entry.parent().unwrap();
    for c in IMPORT.captures_iter(&source) {
        module_graph(&normalize(&dir.join(&c[1])), seen)?;
    }
    Ok(())
}

/// "a/./b/../c" -> "a/c", without touching the file system.
fn normalize(path: &Path) -> PathBuf {
    let mut out = PathBuf::new();
    for part in path.components() {
        match part {
            Component::CurDir => {}
            Component::ParentDir => {
                out.pop();
            }
            other => out.push(other),
        }
    }
    out
}

/// The site's pages and scripts (not the ~16 000 data files).
fn list_files(dir: &Path) -> crate::Result<Vec<PathBuf>> {
    let mut files = Vec::new();
    for entry in fs::read_dir(dir)? {
        let entry = entry?;
        let path = entry.path();
        if entry.file_type()?.is_dir() {
            if entry.file_name() != "data" {
                files.extend(list_files(&path)?);
            }
        } else {
            files.push(path);
        }
    }
    Ok(files)
}

/// Comments out, whitespace collapsed. Spaces inside values (calc(), grid templates) stay.
fn minify_css(css: &str) -> String {
    static COMMENT: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"(?s)/\*.*?\*/").unwrap());
    static SPACE: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"\s+").unwrap());
    static AROUND: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"\s*([{};])\s*").unwrap());
    let css = COMMENT.replace_all(css, "");
    let css = SPACE.replace_all(&css, " ");
    AROUND.replace_all(&css, "$1").replace(";}", "}").trim().to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn hidden_gear() {
        let src = "{ id: 'tops', label: 'Tops', subs: [\n  { id: 'gear', label: 'Gear & lifestyle', hidden: true, subs: [";
        assert_eq!(hidden_departments(src), vec!["gear"]);
    }

    #[test]
    fn css() {
        assert_eq!(minify_css("/* x */\n.a {\n  width: calc(1px + 2px);\n  color: red;\n}\n"), ".a{width: calc(1px + 2px);color: red}");
    }

    #[test]
    fn paths() {
        assert_eq!(normalize(Path::new("/s/./lib/../lib/a.mjs")), PathBuf::from("/s/lib/a.mjs"));
    }
}
