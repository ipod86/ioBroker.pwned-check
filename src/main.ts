/*
 * ioBroker pwned-check adapter
 * Leak & Password Check (Privacy First)
 */

import { exec } from "node:child_process";

import * as utils from "@iobroker/adapter-core";

interface PasswordEntry {
	id: string;
	description: string;
	hash: string;
}

interface EmailEntry {
	id: string;
	email: string;
}

interface AdapterConfig {
	passwords: PasswordEntry[];
	emails: EmailEntry[];
	checkInterval: number;
	theme: "light" | "dark";
	bgOpacity: number;
	cardOpacity: number;
	fontSize: number;
	cardColor: string;
	compactView: boolean;
}

type Lang = "en" | "de" | "ru" | "pt" | "nl" | "fr" | "it" | "es" | "pl" | "uk" | "zh-cn";

const TRANSLATIONS: Record<string, Record<Lang, string>> = {
	pwFound: {
		en: '[pwned-check] Password "%s" found in %n data breach(es)! Please change it immediately.',
		de: '[pwned-check] Passwort "%s" in %n Datenleck(s) gefunden! Bitte sofort ändern.',
		ru: '[pwned-check] Пароль "%s" найден в %n утечках данных! Немедленно смените его.',
		pt: '[pwned-check] Senha "%s" encontrada em %n violação(ões) de dados! Altere-a imediatamente.',
		nl: '[pwned-check] Wachtwoord "%s" gevonden in %n datalek(ken)! Verander het onmiddellijk.',
		fr: '[pwned-check] Mot de passe "%s" trouvé dans %n violation(s) de données ! Changez-le immédiatement.',
		it: '[pwned-check] Password "%s" trovata in %n violazione/i dei dati! Cambiarla immediatamente.',
		es: '[pwned-check] Contraseña "%s" encontrada en %n filtración(es) de datos. ¡Cámbiela de inmediato!',
		pl: '[pwned-check] Hasło "%s" znalezione w %n wycieku(ach) danych! Zmień je natychmiast.',
		uk: '[pwned-check] Пароль "%s" знайдено в %n витоку(ах) даних! Негайно змініть його.',
		"zh-cn": '[pwned-check] 密码 "%s" 已在 %n 次数据泄露中发现！请立即更改。',
	},
	pwIncreased: {
		en: '[pwned-check] Password "%s" now found in %n breaches (was %p).',
		de: '[pwned-check] Passwort "%s" jetzt in %n Lecks gefunden (vorher %p).',
		ru: '[pwned-check] Пароль "%s" теперь найден в %n утечках (ранее %p).',
		pt: '[pwned-check] Senha "%s" agora encontrada em %n violações (antes %p).',
		nl: '[pwned-check] Wachtwoord "%s" nu gevonden in %n lekken (was %p).',
		fr: '[pwned-check] Mot de passe "%s" maintenant dans %n fuites (avant %p).',
		it: '[pwned-check] Password "%s" ora in %n violazioni (prima %p).',
		es: '[pwned-check] Contraseña "%s" ahora en %n filtraciones (antes %p).',
		pl: '[pwned-check] Hasło "%s" teraz w %n wyciekach (wcześniej %p).',
		uk: '[pwned-check] Пароль "%s" тепер у %n витоках (раніше %p).',
		"zh-cn": '[pwned-check] 密码 "%s" 现在在 %n 次泄露中发现（之前 %p 次）。',
	},
	pwCleared: {
		en: '[pwned-check] Security cleared: Password "%s" is no longer found in known breaches.',
		de: '[pwned-check] Sicherheit wiederhergestellt: Passwort "%s" nicht mehr in bekannten Lecks gefunden.',
		ru: '[pwned-check] Безопасность восстановлена: пароль "%s" больше не найден в известных утечках.',
		pt: '[pwned-check] Segurança restaurada: Senha "%s" não encontrada em violações conhecidas.',
		nl: '[pwned-check] Beveiliging hersteld: Wachtwoord "%s" niet meer gevonden in bekende lekken.',
		fr: '[pwned-check] Sécurité rétablie : le mot de passe "%s" n\'est plus dans les fuites connues.',
		it: '[pwned-check] Sicurezza ripristinata: la password "%s" non è più trovata in violazioni note.',
		es: '[pwned-check] Seguridad restablecida: la contraseña "%s" ya no aparece en filtraciones conocidas.',
		pl: '[pwned-check] Bezpieczeństwo przywrócone: hasło "%s" nie jest już w znanych wyciekach.',
		uk: '[pwned-check] Безпека відновлена: пароль "%s" більше не знайдено у відомих витоках.',
		"zh-cn": '[pwned-check] 安全已恢复：密码 "%s" 不再出现在已知泄露中。',
	},
	emailFound: {
		en: '[pwned-check] Email "%s" found in %n data breach(es): %b',
		de: '[pwned-check] E-Mail "%s" in %n Datenleck(s) gefunden: %b',
		ru: '[pwned-check] E-mail "%s" найден в %n утечках данных: %b',
		pt: '[pwned-check] E-mail "%s" encontrado em %n violação(ões): %b',
		nl: '[pwned-check] E-mail "%s" gevonden in %n datalek(ken): %b',
		fr: '[pwned-check] E-mail "%s" trouvé dans %n violation(s) de données : %b',
		it: '[pwned-check] E-mail "%s" trovata in %n violazione/i: %b',
		es: '[pwned-check] E-mail "%s" encontrado en %n filtración(es): %b',
		pl: '[pwned-check] E-mail "%s" znaleziony w %n wycieku(ach): %b',
		uk: '[pwned-check] E-mail "%s" знайдено в %n витоку(ах): %b',
		"zh-cn": '[pwned-check] 邮箱 "%s" 在 %n 次数据泄露中发现：%b',
	},
	malwareDetected: {
		en: "[pwned-check] MALWARE DETECTED: pawns-cli is running on this system! This software secretly sells your internet bandwidth. Your ioBroker was likely infected via a malicious script. Kill the process and check your global scripts immediately!",
		de: "[pwned-check] MALWARE ERKANNT: pawns-cli läuft auf diesem System! Diese Software verkauft heimlich Ihre Internetbandbreite. Ihr ioBroker wurde wahrscheinlich über ein bösartiges Skript infiziert. Prozess beenden und globale Skripte sofort prüfen!",
		ru: "[pwned-check] ОБНАРУЖЕНА ВРЕДОНОСНАЯ ПРОГРАММА: pawns-cli запущен на этом устройстве! Эта программа тайно продаёт ваш интернет-трафик. Немедленно завершите процесс и проверьте глобальные скрипты!",
		pt: "[pwned-check] MALWARE DETECTADO: pawns-cli está a correr neste sistema! Este software vende secretamente a sua largura de banda. Termine o processo e verifique os scripts globais imediatamente!",
		nl: "[pwned-check] MALWARE GEDETECTEERD: pawns-cli draait op dit systeem! Deze software verkoopt uw internetbandbreedte. Beëindig het proces en controleer uw globale scripts onmiddellijk!",
		fr: "[pwned-check] MALWARE DÉTECTÉ : pawns-cli tourne sur ce système ! Ce logiciel revend votre bande passante à votre insu. Arrêtez le processus et vérifiez vos scripts globaux immédiatement !",
		it: "[pwned-check] MALWARE RILEVATO: pawns-cli è in esecuzione su questo sistema! Questo software vende segretamente la vostra larghezza di banda. Terminate il processo e controllate subito gli script globali!",
		es: "[pwned-check] MALWARE DETECTADO: ¡pawns-cli está corriendo en este sistema! Este software vende secretamente su ancho de banda. ¡Detenga el proceso y revise sus scripts globales inmediatamente!",
		pl: "[pwned-check] WYKRYTO MALWARE: pawns-cli działa na tym systemie! To oprogramowanie potajemnie sprzedaje Twój transfer internetowy. Zatrzymaj proces i natychmiast sprawdź globalne skrypty!",
		uk: "[pwned-check] ВИЯВЛЕНО ШКІДЛИВЕ ПЗ: pawns-cli запущено на цьому пристрої! Ця програма таємно продає ваш інтернет-трафік. Негайно зупиніть процес і перевірте глобальні скрипти!",
		"zh-cn":
			"[pwned-check] 检测到恶意软件：pawns-cli 正在此系统上运行！该软件秘密出售您的网络带宽。请立即终止该进程并检查全局脚本！",
	},
	emailCleared: {
		en: '[pwned-check] Security cleared: Email "%s" is no longer found in known breaches.',
		de: '[pwned-check] Sicherheit wiederhergestellt: E-Mail "%s" nicht mehr in bekannten Lecks gefunden.',
		ru: '[pwned-check] Безопасность восстановлена: e-mail "%s" больше не найден в известных утечках.',
		pt: '[pwned-check] Segurança restaurada: E-mail "%s" não encontrado em violações conhecidas.',
		nl: '[pwned-check] Beveiliging hersteld: E-mail "%s" niet meer gevonden in bekende lekken.',
		fr: "[pwned-check] Sécurité rétablie : l'e-mail \"%s\" n'est plus dans les fuites connues.",
		it: '[pwned-check] Sicurezza ripristinata: l\'e-mail "%s" non è più in violazioni note.',
		es: '[pwned-check] Seguridad restablecida: el e-mail "%s" ya no aparece en filtraciones conocidas.',
		pl: '[pwned-check] Bezpieczeństwo przywrócone: e-mail "%s" nie jest już w znanych wyciekach.',
		uk: '[pwned-check] Безпека відновлена: e-mail "%s" більше не знайдено у відомих витоках.',
		"zh-cn": '[pwned-check] 安全已恢复：邮箱 "%s" 不再出现在已知泄露中。',
	},
};

function t(key: string, lang: Lang, vars: { s?: string; n?: number; p?: number; b?: string } = {}): string {
	const tpl = TRANSLATIONS[key]?.[lang] ?? TRANSLATIONS[key]?.en ?? key;
	return tpl
		.replace("%s", vars.s ?? "")
		.replace("%n", String(vars.n ?? ""))
		.replace("%p", String(vars.p ?? ""))
		.replace("%b", vars.b ?? "");
}

/**
 * Normalizes a string to a valid ioBroker object ID segment
 *
 * @param str - Input string
 * @returns Normalized ID string
 */
function normalizeId(str: string): string {
	return str.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();
}

/**
 * Performs an HTTPS GET request and returns the response body
 *
 * @param url - The URL to GET
 * @param attempt - Current attempt number (for retry logic)
 * @returns Response body as string
 */
async function httpsGet(url: string, attempt = 1): Promise<string> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), 15000);
	try {
		const res = await fetch(url, {
			headers: { "User-Agent": "ioBroker-pwned-check/0.0.1" },
			signal: controller.signal,
		});
		return await res.text();
	} catch (err: any) {
		if (err?.name === "AbortError") {
			if (attempt < 2) {
				await sleep(3000);
				return httpsGet(url, attempt + 1);
			}
			throw new Error("Request timed out");
		}
		throw err;
	} finally {
		clearTimeout(timer);
	}
}

function sleep(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function isValidEmail(email: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

class PwnedCheck extends utils.Adapter {
	private checkTimer: ReturnType<typeof setTimeout> | null = null;
	private prevState: Map<string, { isPwned: boolean; leakCount?: number }> = new Map();
	private lang: Lang = "en";

	public constructor(options: Partial<utils.AdapterOptions> = {}) {
		super({
			...options,
			name: "pwned-check",
		});
		this.on("ready", this.onReady.bind(this));
		this.on("message", this.onMessage.bind(this));
		this.on("unload", this.onUnload.bind(this));
	}

	/**
	 * Adapter ready handler — runs full check and sets up interval
	 */
	private async onReady(): Promise<void> {
		void this.setState("info.connection", { val: false, ack: true });

		try {
			const sysConfig = await this.getForeignObjectAsync("system.config");
			const syslang = (sysConfig?.common as any)?.language as string | undefined;
			if (syslang && syslang in TRANSLATIONS.pwFound) {
				this.lang = syslang as Lang;
			}
		} catch {
			// use default "en"
		}

		const config = this.config as unknown as AdapterConfig;

		// Load previous isPwned states to avoid re-notifying on restart
		await this.loadPrevState(config);

		// Clean up orphaned objects from removed config entries
		await this.cleanupOrphanedObjects(config);

		// Run initial check
		await this.runAllChecks(config);

		// Set up periodic interval
		const intervalHours = config.checkInterval ?? 24;
		const intervalMs = intervalHours * 60 * 60 * 1000;
		this.checkTimer = setInterval(async () => {
			await this.runAllChecks(this.config as unknown as AdapterConfig);
		}, intervalMs);
	}

	/**
	 * Message handler for sendTo commands
	 *
	 * @param obj - Message object
	 */
	private async onMessage(obj: ioBroker.Message): Promise<void> {
		if (obj.command === "checkNow") {
			this.log.info("Manual check triggered via sendTo");
			await this.runAllChecks(this.config as unknown as AdapterConfig);
			if (obj.callback) {
				this.sendTo(obj.from, obj.command, { result: "ok" }, obj.callback);
			}
		}
	}

	/**
	 * Unload handler — clears the check interval
	 *
	 * @param callback - Callback to signal unload complete
	 */
	private onUnload(callback: () => void): void {
		if (this.checkTimer) {
			clearInterval(this.checkTimer);
			this.checkTimer = null;
		}
		callback();
	}

	/**
	 * Runs all password and email checks, then updates the visualisation DP
	 *
	 * @param config - Adapter configuration
	 */
	private async runAllChecks(config: AdapterConfig): Promise<void> {
		void this.setState("info.connection", { val: true, ack: true });

		const passwords = config.passwords ?? [];
		const emails = config.emails ?? [];

		for (const entry of passwords) {
			if (!entry.hash || entry.hash.length < 6) {
				this.log.warn(`Password entry "${entry.description}" has no valid hash, skipping`);
				continue;
			}
			await this.checkPasswordEntry(entry);
			await sleep(1000);
		}

		for (const entry of emails) {
			if (!isValidEmail(entry.email)) {
				this.log.warn(`Email entry "${entry.email}" has invalid format, skipping`);
				continue;
			}
			await this.checkEmailEntry(entry);
			await sleep(1000);
		}

		// Check for pawns-cli malware
		await this.checkMalware();

		// Update global anyPwned status (includes malware detection)
		const anyPwned = [...this.prevState.values()].some(s => s.isPwned);
		await this.setObjectNotExistsAsync("info.anyPwned", {
			type: "state",
			common: {
				name: "Any entry pwned",
				role: "indicator.alarm",
				type: "boolean",
				read: true,
				write: false,
				def: false,
			},
			native: {},
		});
		await this.setStateAsync("info.anyPwned", { val: anyPwned, ack: true });

		await this.updateVisualisation(config);
	}

	/**
	 * Checks a single password hash against HIBP k-anonymity API
	 *
	 * @param entry - The password entry with pre-computed SHA-1 hash
	 */
	private async checkPasswordEntry(entry: PasswordEntry): Promise<void> {
		const safeId = normalizeId(entry.description);
		const prefix = entry.hash.substring(0, 5).toUpperCase();
		const suffix = entry.hash.substring(5).toUpperCase();
		const now = new Date().toISOString();

		try {
			const body = await httpsGet(`https://api.pwnedpasswords.com/range/${prefix}`);
			const lines = body.split("\n");
			let leakCount = 0;
			let found = false;

			for (const line of lines) {
				const [lineSuffix, countStr] = line.trim().split(":");
				if (lineSuffix && lineSuffix.toUpperCase() === suffix) {
					leakCount = parseInt(countStr ?? "0", 10) || 0;
					found = true;
					break;
				}
			}

			const isPwned = found && leakCount > 0;

			// Ensure objects exist
			await this.setObjectNotExistsAsync(`passwords.${safeId}`, {
				type: "channel",
				common: { name: entry.description },
				native: {},
			});
			await this.setObjectNotExistsAsync(`passwords.${safeId}.isPwned`, {
				type: "state",
				common: {
					name: `${entry.description} — is pwned`,
					role: "indicator.alarm",
					type: "boolean",
					read: true,
					write: false,
					def: false,
				},
				native: {},
			});
			await this.setObjectNotExistsAsync(`passwords.${safeId}.leakCount`, {
				type: "state",
				common: {
					name: `${entry.description} — leak count`,
					role: "value",
					type: "number",
					read: true,
					write: false,
					def: 0,
				},
				native: {},
			});
			await this.setObjectNotExistsAsync(`passwords.${safeId}.lastCheck`, {
				type: "state",
				common: {
					name: `${entry.description} — last check`,
					role: "date",
					type: "string",
					read: true,
					write: false,
					def: "",
				},
				native: {},
			});

			await this.setStateAsync(`passwords.${safeId}.isPwned`, { val: isPwned, ack: true });
			await this.setStateAsync(`passwords.${safeId}.leakCount`, { val: leakCount, ack: true });
			await this.setStateAsync(`passwords.${safeId}.lastCheck`, { val: now, ack: true });

			// Notification logic
			const prevKey = `password:${safeId}`;
			const prev = this.prevState.get(prevKey);

			if (isPwned) {
				if (!prev?.isPwned) {
					// Newly pwned
					this.log.warn(`Password for "${entry.description}" found in ${leakCount} breaches!`);
					await this.registerNotification(
						"pwned-check",
						"breach",
						t("pwFound", this.lang, { s: entry.description, n: leakCount }),
					);
				} else if (prev.leakCount !== undefined && leakCount > prev.leakCount) {
					await this.registerNotification(
						"pwned-check",
						"breach",
						t("pwIncreased", this.lang, { s: entry.description, n: leakCount, p: prev.leakCount }),
					);
				}
			} else if (prev?.isPwned) {
				// Cleared!
				this.log.info(`Password for "${entry.description}" is no longer found in breaches.`);
				await this.registerNotification(
					"pwned-check",
					"breach",
					t("pwCleared", this.lang, { s: entry.description }),
				);
			}

			this.prevState.set(prevKey, { isPwned, leakCount });
			this.log.debug(`Password check for "${entry.description}": isPwned=${isPwned}, leakCount=${leakCount}`);
		} catch (err) {
			this.log.error(`Error checking password for "${entry.description}": ${String(err)}`);
		}
	}

	/**
	 * Checks a single email address against XposedOrNot API
	 *
	 * @param entry - The email entry
	 */
	private async checkEmailEntry(entry: EmailEntry): Promise<void> {
		const safeId = normalizeId(entry.email);
		const now = new Date().toISOString();

		try {
			const body = await httpsGet(
				`https://api.xposedornot.com/v1/breach-analytics?email=${encodeURIComponent(entry.email)}`,
			);
			let parsed: {
				ExposedBreaches?: { breaches_details?: Array<{ breach: string; xposed_date?: string }> };
				Error?: string;
			};
			try {
				parsed = JSON.parse(body);
			} catch {
				this.log.error(`Invalid JSON from XposedOrNot for "${entry.email}": ${body}`);
				return;
			}

			// Map breach name → year
			const breachMap = new Map<string, string>();
			let isPwned = false;

			if (parsed.Error === "Not found") {
				isPwned = false;
			} else if (parsed.ExposedBreaches?.breaches_details) {
				for (const detail of parsed.ExposedBreaches.breaches_details) {
					if (detail.breach) {
						breachMap.set(detail.breach, detail.xposed_date ?? "");
					}
				}
				isPwned = breachMap.size > 0;
			}

			const breachList = [...breachMap.keys()];

			// Ensure objects exist
			await this.setObjectNotExistsAsync(`emails.${safeId}`, {
				type: "channel",
				common: { name: entry.email },
				native: {},
			});
			await this.setObjectNotExistsAsync(`emails.${safeId}.isPwned`, {
				type: "state",
				common: {
					name: `${entry.email} — is pwned`,
					role: "indicator.alarm",
					type: "boolean",
					read: true,
					write: false,
					def: false,
				},
				native: {},
			});
			await this.setObjectNotExistsAsync(`emails.${safeId}.lastCheck`, {
				type: "state",
				common: {
					name: `${entry.email} — last check`,
					role: "date",
					type: "string",
					read: true,
					write: false,
					def: "",
				},
				native: {},
			});

			await this.setStateAsync(`emails.${safeId}.isPwned`, { val: isPwned, ack: true });
			await this.setStateAsync(`emails.${safeId}.lastCheck`, { val: now, ack: true });

			if (isPwned) {
				// Create/update per-breach leak DPs — value is the breach year (or "unknown")
				for (const [service, year] of breachMap) {
					const safeService = normalizeId(service);
					await this.extendObjectAsync(`emails.${safeId}.leaks.${safeService}`, {
						type: "state",
						common: {
							name: service,
							role: "text",
							type: "string",
							read: true,
							write: false,
							def: "",
						},
						native: {},
					});
					await this.setStateAsync(`emails.${safeId}.leaks.${safeService}`, {
						val: year || "unknown",
						ack: true,
					});
				}
			} else {
				// Delete all .leaks.* children
				await this.deleteLeakChildren(safeId);
			}

			// Notification logic
			const prevKey = `email:${safeId}`;
			const prev = this.prevState.get(prevKey);

			if (isPwned) {
				if (!prev?.isPwned) {
					this.log.warn(
						`Email "${entry.email}" found in ${breachList.length} breach(es): ${breachList.join(", ")}`,
					);
					await this.registerNotification(
						"pwned-check",
						"breach",
						t("emailFound", this.lang, {
							s: entry.email,
							n: breachList.length,
							b: breachList.join(", "),
						}),
					);
				}
			} else if (prev?.isPwned) {
				this.log.info(`Email "${entry.email}" is no longer found in breaches.`);
				await this.registerNotification(
					"pwned-check",
					"breach",
					t("emailCleared", this.lang, { s: entry.email }),
				);
			}

			this.prevState.set(prevKey, { isPwned });
			this.log.debug(`Email check for "${entry.email}": isPwned=${isPwned}, breaches=${breachList.join(",")}`);
		} catch (err) {
			this.log.error(`Error checking email for "${entry.email}": ${String(err)}`);
		}
	}

	/**
	 * Deletes all leaks.* child states for a given email safeId
	 *
	 * @param safeId - Normalized email label ID
	 */
	private async deleteLeakChildren(safeId: string): Promise<void> {
		try {
			const objects = await this.getObjectViewAsync("system", "state", {
				startkey: `${this.namespace}.emails.${safeId}.leaks.`,
				endkey: `${this.namespace}.emails.${safeId}.leaks.\u9999`,
			});
			if (objects?.rows) {
				for (const row of objects.rows) {
					const id = row.id.replace(`${this.namespace}.`, "");
					await this.delObjectAsync(id);
				}
			}
		} catch {
			// Ignore errors if no leaks exist
		}
	}

	// ─── Malware check ───────────────────────────────────────────────────────

	/**
	 * Checks whether the pawns-cli malware process is running on this system.
	 * Returns the matched process line, or null if not found.
	 */
	private isPawnsCliRunning(): Promise<string | null> {
		return new Promise(resolve => {
			exec("ps aux", (_err, stdout) => {
				const match = stdout
					.split("\n")
					.filter(l => !l.includes("grep"))
					.find(l => l.includes("pawns-cli"));
				resolve(match ?? null);
			});
		});
	}

	/**
	 * Runs the pawns-cli malware detection check and updates DPs + notifications
	 */
	private async checkMalware(): Promise<void> {
		const now = new Date().toISOString();
		try {
			const processLine = await this.isPawnsCliRunning();
			const detected = processLine !== null;

			await this.setObjectNotExistsAsync("system.pawns", {
				type: "channel",
				common: { name: "Malware: pawns-cli (Proxy-Monetarisierung)" },
				native: {},
			});
			await this.setObjectNotExistsAsync("system.pawns.detected", {
				type: "state",
				common: {
					name: "pawns-cli erkannt (Proxy-Malware verkauft Ihre Bandbreite)",
					role: "indicator.alarm",
					type: "boolean",
					read: true,
					write: false,
					def: false,
				},
				native: {},
			});
			await this.setObjectNotExistsAsync("system.pawns.processInfo", {
				type: "state",
				common: {
					name: "pawns-cli Prozessinformationen",
					role: "text",
					type: "string",
					read: true,
					write: false,
					def: "",
				},
				native: {},
			});
			await this.setObjectNotExistsAsync("system.pawns.lastCheck", {
				type: "state",
				common: {
					name: "pawns-cli letzter Check",
					role: "date",
					type: "string",
					read: true,
					write: false,
					def: "",
				},
				native: {},
			});

			await this.setStateAsync("system.pawns.detected", { val: detected, ack: true });
			await this.setStateAsync("system.pawns.processInfo", {
				val: detected ? processLine.trim() : "",
				ack: true,
			});
			await this.setStateAsync("system.pawns.lastCheck", { val: now, ack: true });

			const prevKey = "system:pawns";

			if (detected) {
				this.log.warn(
					`Malware pawns-cli detected! Process: ${processLine.trim()}. This software sells your internet bandwidth.`,
				);
				await this.registerNotification("pwned-check", "breach", t("malwareDetected", this.lang));
			} else {
				this.log.debug("Malware check: pawns-cli not running.");
			}

			this.prevState.set(prevKey, { isPwned: detected });
		} catch (err) {
			this.log.error(`Error during malware check: ${String(err)}`);
		}
	}

	/**
	 * Cleans up orphaned object trees for passwords/emails removed from config
	 *
	 * @param config - Current adapter configuration
	 */
	private async loadPrevState(config: AdapterConfig): Promise<void> {
		for (const entry of config.passwords ?? []) {
			const safeId = normalizeId(entry.description);
			try {
				const isPwnedState = await this.getStateAsync(`passwords.${safeId}.isPwned`);
				const leakCountState = await this.getStateAsync(`passwords.${safeId}.leakCount`);
				if (isPwnedState != null) {
					this.prevState.set(`password:${safeId}`, {
						isPwned: isPwnedState.val === true,
						leakCount: typeof leakCountState?.val === "number" ? leakCountState.val : 0,
					});
				}
			} catch {
				// DP may not exist yet on first start
			}
		}
		for (const entry of config.emails ?? []) {
			const safeId = normalizeId(entry.email);
			try {
				const isPwnedState = await this.getStateAsync(`emails.${safeId}.isPwned`);
				if (isPwnedState != null) {
					this.prevState.set(`email:${safeId}`, { isPwned: isPwnedState.val === true });
				}
			} catch {
				// ignore
			}
		}
	}

	private async cleanupOrphanedObjects(config: AdapterConfig): Promise<void> {
		const configPasswordIds = new Set((config.passwords ?? []).map(p => normalizeId(p.description)));
		const configEmailIds = new Set((config.emails ?? []).map(e => normalizeId(e.email)));

		// Clean up passwords
		try {
			const pwObjects = await this.getObjectViewAsync("system", "channel", {
				startkey: `${this.namespace}.passwords.`,
				endkey: `${this.namespace}.passwords.\u9999`,
			});
			if (pwObjects?.rows) {
				for (const row of pwObjects.rows) {
					const fullId = row.id;
					const parts = fullId.split(".");
					const channelName = parts[parts.length - 1];
					if (!configPasswordIds.has(channelName)) {
						this.log.info(`Removing orphaned password object tree: ${channelName}`);
						await this.delObjectAsync(`passwords.${channelName}`, { recursive: true } as any);
					}
				}
			}
		} catch {
			// ignore
		}

		// Clean up emails
		try {
			const emailObjects = await this.getObjectViewAsync("system", "channel", {
				startkey: `${this.namespace}.emails.`,
				endkey: `${this.namespace}.emails.\u9999`,
			});
			if (emailObjects?.rows) {
				for (const row of emailObjects.rows) {
					const fullId = row.id;
					const parts = fullId.split(".");
					const channelName = parts[parts.length - 1];
					if (!configEmailIds.has(channelName) && channelName !== "leaks") {
						this.log.info(`Removing orphaned email object tree: ${channelName}`);
						await this.delObjectAsync(`emails.${channelName}`, { recursive: true } as any);
					}
				}
			}
		} catch {
			// ignore
		}
	}

	/**
	 * Updates the visualisation HTML datapoint
	 *
	 * @param config - Adapter configuration
	 */
	private async updateVisualisation(config: AdapterConfig): Promise<void> {
		const passwords = config.passwords ?? [];
		const emails = config.emails ?? [];
		const theme = config.theme ?? "light";
		const bgOpacity = config.bgOpacity ?? 100;
		const cardOpacity = config.cardOpacity ?? 100;
		const fontSize = config.fontSize ?? 14;
		const cardColor = config.cardColor ?? "";
		const compactView = config.compactView ?? false;

		const isDark = theme === "dark";

		const bgRgb = isDark ? "245,245,245" : "26,26,46";
		const textColor = isDark ? "#212121" : "#e0e0e0";
		const borderColor = isDark ? "#e0e0e0" : "#0f3460";

		const bgColor = `rgba(${bgRgb},${(bgOpacity / 100).toFixed(2)})`;

		// Card background: custom color > theme default
		let safeCardBg: string;
		if (cardColor) {
			const hex = cardColor.replace("#", "");
			const r = parseInt(hex.substring(0, 2), 16);
			const g = parseInt(hex.substring(2, 4), 16);
			const b = parseInt(hex.substring(4, 6), 16);
			safeCardBg = `rgba(${r},${g},${b},${(cardOpacity / 100).toFixed(2)})`;
		} else {
			const cardRgb = isDark ? "255,255,255" : "22,33,62";
			safeCardBg = `rgba(${cardRgb},${(cardOpacity / 100).toFixed(2)})`;
		}

		const safeTextColor = textColor;

		const lastUpdateMs = Date.now();
		const lastUpdateStr = new Date(lastUpdateMs).toLocaleString();

		// Gather current states for passwords
		const pwCards: string[] = [];
		for (const entry of passwords) {
			const safeId = normalizeId(entry.description);
			let isPwned = false;
			let leakCount = 0;

			try {
				const isPwnedState = await this.getStateAsync(`passwords.${safeId}.isPwned`);
				const leakCountState = await this.getStateAsync(`passwords.${safeId}.leakCount`);
				isPwned = isPwnedState?.val === true;
				leakCount = typeof leakCountState?.val === "number" ? leakCountState.val : 0;
			} catch {
				// ignore
			}

			const lockSvg = isPwned
				? `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#e53935" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>`
				: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#43a047" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`;

			const statusColor = isPwned ? "#e53935" : "#43a047";
			const statusText = isPwned ? `PWNED (${leakCount}×)` : "SAFE";

			pwCards.push(
				compactView
					? `<div style="background:${safeCardBg};border:1px solid ${borderColor};border-radius:8px;padding:10px 14px;display:flex;align-items:center;gap:10px;">
					${lockSvg}
					<div style="font-weight:600;color:${safeTextColor};">${escapeHtml(entry.description)}</div>
				</div>`
					: `<div style="background:${safeCardBg};border:1px solid ${borderColor};border-radius:8px;padding:16px;display:flex;align-items:center;gap:16px;">
					${lockSvg}
					<div>
						<div style="font-weight:600;color:${safeTextColor};">${escapeHtml(entry.description)}</div>
						<div style="font-size:0.85em;color:${statusColor};font-weight:500;">${statusText}</div>
					</div>
				</div>`,
			);
		}

		// Gather current states for emails
		const emailCards: string[] = [];
		for (const entry of emails) {
			const safeId = normalizeId(entry.email);
			let isPwned = false;
			const breachNames: string[] = [];

			try {
				const isPwnedState = await this.getStateAsync(`emails.${safeId}.isPwned`);
				isPwned = isPwnedState?.val === true;

				if (isPwned) {
					const leakObjects = await this.getObjectViewAsync("system", "state", {
						startkey: `${this.namespace}.emails.${safeId}.leaks.`,
						endkey: `${this.namespace}.emails.${safeId}.leaks.\u9999`,
					});
					if (leakObjects?.rows) {
						for (const row of leakObjects.rows) {
							const parts = row.id.split(".");
							breachNames.push(parts[parts.length - 1].replace(/_/g, " "));
						}
					}
				}
			} catch {
				// ignore
			}

			const lockSvg = isPwned
				? `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#e53935" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>`
				: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#43a047" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`;

			const statusColor = isPwned ? "#e53935" : "#43a047";
			const statusText = isPwned ? `PWNED (${breachNames.length}×)` : "SAFE";

			emailCards.push(
				compactView
					? `<div style="background:${safeCardBg};border:1px solid ${borderColor};border-radius:8px;padding:10px 14px;display:flex;align-items:center;gap:10px;">
					${lockSvg}
					<div style="font-weight:600;color:${safeTextColor};">${escapeHtml(entry.email)}</div>
				</div>`
					: `<div style="background:${safeCardBg};border:1px solid ${borderColor};border-radius:8px;padding:16px;display:flex;align-items:center;gap:16px;">
					${lockSvg}
					<div>
						<div style="font-weight:600;color:${safeTextColor};">${escapeHtml(entry.email)}</div>
						<div style="font-size:0.85em;color:${statusColor};font-weight:500;">${statusText}</div>
					</div>
				</div>`,
			);
		}

		// Malware card
		let malwareDetected = false;
		try {
			const malwareState = await this.getStateAsync("system.pawns.detected");
			malwareDetected = malwareState?.val === true;
		} catch {
			// ignore
		}

		const malwareSvg = malwareDetected
			? `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#e53935" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`
			: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#43a047" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`;
		const malwareStatusColor = malwareDetected ? "#e53935" : "#43a047";
		const malwareStatusText = malwareDetected
			? "MALWARE AKTIV! pawns-cli verkauft Ihre Bandbreite."
			: "Kein Befall erkannt";
		const malwareSubText = malwareDetected
			? "Prozess sofort beenden & globale Skripte prüfen!"
			: "pawns-cli (Proxy-Monetarisierung)";
		const malwareCard = compactView
			? `<div style="background:${safeCardBg};border:1px solid ${malwareDetected ? "#e53935" : borderColor};border-radius:8px;padding:10px 14px;display:flex;align-items:center;gap:10px;">
				${malwareSvg}
				<div style="font-weight:600;color:${malwareStatusColor};">pawns-cli: ${malwareDetected ? "MALWARE AKTIV" : "OK"}</div>
			</div>`
			: `<div style="background:${safeCardBg};border:2px solid ${malwareDetected ? "#e53935" : borderColor};border-radius:8px;padding:16px;display:flex;align-items:center;gap:16px;">
				${malwareSvg}
				<div>
					<div style="font-weight:600;color:${safeTextColor};">pawns-cli Malware-Check</div>
					<div style="font-size:0.9em;color:${malwareStatusColor};font-weight:600;">${malwareStatusText}</div>
					<div style="font-size:0.8em;color:${safeTextColor};opacity:0.7;">${malwareSubText}</div>
				</div>
			</div>`;

		const html = `
<div style="font-family:sans-serif;font-size:${fontSize}px;background:${bgColor};padding:16px;border-radius:10px;color:${safeTextColor};">
	<h3 style="margin:0 0 12px 0;color:${safeTextColor};">Pwned Check</h3>
	${passwords.length > 0 ? `<div style="font-size:13px;font-weight:600;margin-bottom:8px;color:${safeTextColor};">Passwords</div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px;margin-bottom:16px;">${pwCards.join("")}</div>` : ""}
	${emails.length > 0 ? `<div style="font-size:13px;font-weight:600;margin-bottom:8px;color:${safeTextColor};">E-Mails</div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px;margin-bottom:16px;">${emailCards.join("")}</div>` : ""}
	<div style="font-size:13px;font-weight:600;margin-bottom:8px;color:${safeTextColor};">System</div>
	<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px;">
		${malwareCard}
	</div>
	${passwords.length === 0 && emails.length === 0 ? `<div style="color:#888;font-size:0.9em;margin-top:8px;">No password/email entries configured.</div>` : ""}
	<div style="font-size:0.8em;color:#888;margin-top:10px;">Last check: ${lastUpdateStr}</div>
</div>`;

		await this.setStateAsync("visualisation", { val: html, ack: true });
	}
}

/**
 * Escapes HTML special characters
 *
 * @param str - Input string
 * @returns HTML-escaped string
 */
function escapeHtml(str: string): string {
	return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

if (require.main !== module) {
	// Export the constructor in compact mode
	module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new PwnedCheck(options);
} else {
	// otherwise start the instance directly
	(() => new PwnedCheck())();
}
