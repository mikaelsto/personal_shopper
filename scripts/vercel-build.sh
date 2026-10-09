#!/usr/bin/env bash
# Vercel's build command (see vercel.json). Vercel's build image has no Rust, so install a
# minimal toolchain first, then build the site into _site/ exactly as the GitHub Pages job does.
set -euo pipefail

if ! command -v cargo >/dev/null; then
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal
  . "$HOME/.cargo/env"
fi

cargo run --release --manifest-path site/Cargo.toml
