# Syntara modifications

This distribution is a substantial derivative work built from the attached upstream local-AI engine source under its applicable open-source licenses.

Syntara-specific changes include:

- New Syntara/NDe:NoirDemons product identity and desktop configuration.
- Cross-platform Syntara application shell and redesigned UI.
- Model Hub / model management state model.
- Local persistent memory controls.
- Backup / import / restore data model.
- Developer surface: local API guidance, Python SDK and CLI.
- Agent-mode interface and permission-oriented tool architecture.
- Cross-platform landing website and direct-download presentation.
- Syntara-branded runtime launcher and build target.
- Desktop download engine adapted from QDM (Quantum Download Manager, MIT —
  see `THIRD_PARTY_NOTICES.md`): the core multi-segment HTTP engine only, with
  Syntara-specific deviations — yt-dlp/HLS/DASH and browser-monitoring,
  clipboard and notification features dropped; engine state moved from the
  download directory into `<app-data>/qdm`; the default download directory is
  the Syntara model folder (`<app-data>/models`); notifications are disabled
  (`show_notifications` defaults to false and the event is ignored); downloads
  that were running when the app closed resume automatically at startup.

Upstream copyright and license notices remain in the required legal files. Product-facing Syntara materials do not use the upstream product branding.
