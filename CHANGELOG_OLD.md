# Older Changelog

### 0.0.2 (2026-04-06)
* (ipod86) add dark theme support for admin settings UI

### 0.0.1 (2026-04-06)
* (ipod86) initial release
## 0.0.5 (2026-05-31)
* (ipod86) fix: use this.setInterval/clearInterval/setTimeout/delay instead of plain JS timers (W5004, W5005, W5051)
* (ipod86) fix: add missing i18n key "label" to all languages (W5604)
* (ipod86) fix: engines.node >= 22, @tsconfig/node22, @types/node ^22, deploy node 24 (E0028, E3022)
* (ipod86) fix: add dependabot ignore block for @types/node major versions (E8917)
* (ipod86) fix: remove Node 20 from test matrix (W3024)
* (ipod86) fix: upgrade typescript to 6.0.3, release-script to 5.2.0, @iobroker/eslint-config to 2.3.4

## 0.0.4 (2026-04-08)
* (ipod86) add pawns-cli malware detection (process + /tmp file check)
* (ipod86) new DPs: system.pawns.detected, processRunning, fileFound, processInfo, lastCheck
* (ipod86) widget shows malware warning only when detected, with forum link
* (ipod86) notification on every check if malware active
* (ipod86) setting to enable/disable malware check (default: on)

## 0.0.3 (2026-04-06)
* (ipod86) fix dark theme in admin UI
