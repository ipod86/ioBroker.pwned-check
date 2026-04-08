![Logo](admin/pwned-check.svg)

# ioBroker.pwned-check

[![NPM version](https://img.shields.io/npm/v/iobroker.pwned-check.svg)](https://www.npmjs.com/package/iobroker.pwned-check)
[![Downloads](https://img.shields.io/npm/dm/iobroker.pwned-check.svg)](https://www.npmjs.com/package/iobroker.pwned-check)
![Number of Installations](https://iobroker.live/badges/pwned-check-installed.svg)
![Current version in stable repository](https://iobroker.live/badges/pwned-check-stable.svg)
[![NPM](https://nodei.co/npm/iobroker.pwned-check.png?downloads=true)](https://nodei.co/npm/iobroker.pwned-check/)

**Tests:** ![Test and Release](https://github.com/ipod86/ioBroker.pwned-check/workflows/Test%20and%20Release/badge.svg)

## ioBroker-Adapter zur Prüfung von Passwort- und E-Mail-Datenlecks

Dieser Adapter prüft, ob Passwörter oder E-Mail-Adressen in bekannten Datenlecks aufgetaucht sind — ohne dass das eigentliche Passwort jemals an einen Server übertragen wird.

## Funktionen

- **Datenschutz zuerst** – Passwörter werden niemals übertragen. Der SHA-1-Hash wird lokal im Browser berechnet; nur die ersten 5 Zeichen werden an die API gesendet (k-Anonymität)
- **Passwortprüfung** – nutzt die kostenlose [Have I Been Pwned](https://haveibeenpwned.com/API/v3#PwnedPasswords) k-Anonymity-API — kein API-Schlüssel erforderlich
- **E-Mail-Prüfung** – nutzt die kostenlose [XposedOrNot](https://xposedornot.com) API — kein API-Schlüssel erforderlich
- **Leak-Details** – einzelne Datenpunkte pro Leak-Quelle unter `emails.<id>.leaks.*`
- **ioBroker-Benachrichtigungen** – sendet eine Systembenachrichtigung bei einem neu erkannten Datenleck, in der konfigurierten Systemsprache (11 Sprachen)
- **HTML-Visualisierung** – erzeugt einen fertigen HTML-Datenpunkt für VIS oder andere Dashboards
- **Konfigurierbares Erscheinungsbild** – Theme (hell/dunkel), Hintergrundtransparenz, Kartentransparenz, Schriftgröße
- **Konfigurierbares Intervall** – Prüfung alle 3, 6, 12 oder 24 Stunden
- **Malware-Erkennung** – erkennt pawns-cli (iProyal-Proxy-Software), die unerlaubt Bandbreite verkauft und ioBroker-Skripte anlegt

## Installation

Adapter über die ioBroker-Admin-Oberfläche installieren — nach **pwned-check** suchen.

## Konfiguration

### Tab „Passwörter"

Einen Eintrag pro zu überwachendem Passwort anlegen. **Bezeichnung** (z. B. Dienst-Name) und **Passwort** eingeben. Der SHA-1-Hash wird im Browser berechnet und gespeichert — das Klartext-Passwort wird nie gespeichert.

| Feld | Beschreibung |
|------|--------------|
| Bezeichnung | Ein Label für dieses Passwort (z. B. „GitHub") |
| Passwort | Einmalig eingeben; nur der SHA-1-Hash wird gespeichert |

### Tab „E-Mails"

Einen Eintrag pro zu überwachender E-Mail-Adresse anlegen.

| Feld | Beschreibung |
|------|--------------|
| E-Mail | Die zu prüfende E-Mail-Adresse |

### Tab „Einstellungen"

| Einstellung | Beschreibung | Standard |
|-------------|--------------|----------|
| Intervall | Wie oft auf neue Datenlecks geprüft wird | 24 Stunden |
| Theme | Helles oder dunkles Erscheinungsbild | Hell |
| Hintergrund-Transparenz | Deckkraft des äußeren Containers (0 = vollständig transparent) | 100% |
| Karten-Transparenz | Deckkraft einzelner Eintrags-Karten | 100% |
| Schriftgröße | Textgröße in der Visualisierung | 14 px |
| Malware-Erkennung | pawns-cli (iProyal) prüfen | an |

## Datenpunkte

Der Adapter legt Datenpunkte unter `pwned-check.<instanz>` an.

### Passwörter

| Datenpunkt | Typ | Beschreibung |
|-----------|-----|--------------|
| `passwords.<id>.isPwned` | boolean | `true` wenn in einem Datenleck gefunden |
| `passwords.<id>.leakCount` | number | Anzahl der Treffer in Leak-Datenbanken |
| `passwords.<id>.lastCheck` | string | ISO-Zeitstempel der letzten erfolgreichen Prüfung |

### E-Mails

| Datenpunkt | Typ | Beschreibung |
|-----------|-----|--------------|
| `emails.<id>.isPwned` | boolean | `true` wenn in einem Datenleck gefunden |
| `emails.<id>.lastCheck` | string | ISO-Zeitstempel der letzten erfolgreichen Prüfung |
| `emails.<id>.leaks.<dienst>` | boolean | `true` für jede gefundene Leak-Quelle |

### System (Malware)

| Datenpunkt | Typ | Beschreibung |
|-----------|-----|--------------|
| `system.pawns.detected` | boolean | `true` wenn pawns-cli erkannt wurde |
| `system.pawns.processRunning` | boolean | `true` wenn der Prozess läuft |
| `system.pawns.fileFound` | boolean | `true` wenn die Datei `/tmp/pawns-cli` existiert |
| `system.pawns.processInfo` | string | Prozesszeile aus `ps aux` (falls gefunden) |
| `system.pawns.lastCheck` | string | ISO-Zeitstempel der letzten Malware-Prüfung |

### Sonstige

| Datenpunkt | Typ | Beschreibung |
|-----------|-----|--------------|
| `visualisation` | string | HTML-Datenpunkt für VIS oder ioBroker.vis-2 |
| `info.connection` | boolean | `true` während eine Prüfung läuft |

## Datenschutz

- Passwörter werden **niemals** im Klartext gespeichert — nur ihr SHA-1-Hash
- Passwort-Hashes werden über die HIBP **k-Anonymität** geprüft: Nur die ersten 5 Hex-Zeichen des Hashes werden übertragen; der vollständige Hash verlässt das System nie
- E-Mail-Adressen werden über HTTPS an die XposedOrNot-API gesendet

## Changelog

### 0.0.4 (2026-04-08)
* (ipod86) pawns-cli-Malware-Erkennung (Prozess- + /tmp-Dateiprüfung)
* (ipod86) neue Datenpunkte: system.pawns.detected, processRunning, fileFound, processInfo, lastCheck
* (ipod86) Widget zeigt Malware-Warnung nur bei Erkennung, mit Forum-Link
* (ipod86) Benachrichtigung bei jeder Prüfung wenn Malware aktiv
* (ipod86) Einstellung zum Aktivieren/Deaktivieren der Malware-Prüfung (Standard: an)

### 0.0.3 (2026-04-06)
* (ipod86) Dunkles Theme in der Admin-UI korrigiert

### 0.0.2 (2026-04-06)
* (ipod86) Dunkles Theme für Admin-Einstellungs-UI hinzugefügt

### 0.0.1 (2026-04-06)
* (ipod86) Erstveröffentlichung

## Lizenz

MIT License

Copyright (c) 2026 ipod86

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
