//! Quantum Download Manager (QDM) download engine, ported into Syntara.
//!
//! Source: <https://github.com/PBhadoo/QDM> — MIT License,
//! Copyright (c) 2026 Parveen Bhadoo. The engine, types and command surface
//! are QDM's own code; see THIRD_PARTY_NOTICES.md for the licence notice and
//! MODIFICATIONS.md for the deviations applied for Syntara (storage layout,
//! auto-resume, video/yt-dlp paths omitted).

pub mod commands;
pub mod engine;
pub mod types;

pub use engine::DownloadEngine;
