#!/usr/bin/env bash
# Vercel's build command (see vercel.json). Vercel builds on Amazon Linux 2023 without Rust, so
# install what the Rust site builder needs, then build the site into _site/ exactly as the
# GitHub Pages job does. Each step is logged so a failed build shows which one broke.
set -euo pipefail

export CARGO_HOME="${CARGO_HOME:-$HOME/.cargo}" RUSTUP_HOME="${RUSTUP_HOME:-$HOME/.rustup}"
export PATH="$CARGO_HOME/bin:$PATH"

# rustc links with the system C compiler (`cc`).
if ! command -v cc >/dev/null; then
  echo "▸ Installing gcc (Rust's linker)"
  dnf install -y -q gcc
fi

if ! command -v cargo >/dev/null; then
  if command -v curl >/dev/null; then
    echo "▸ Installing Rust with rustup"
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal --no-modify-path
  else
    echo "▸ Installing Rust from Amazon Linux packages (no curl)"
    dnf install -y -q rust cargo
  fi
fi

echo "▸ $(cargo --version)"
echo "▸ Building the site"
cargo run --release --manifest-path site/Cargo.toml
