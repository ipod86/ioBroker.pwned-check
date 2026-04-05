/*
 * ioBroker pwned-check adapter
 * Leak & Password Check (Privacy First)
 */

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
	theme: "auto" | "light" | "dark";
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
 * @returns Response body as string
 */
async function httpsGet(url: string): Promise<string> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), 15000);
	try {
		const res = await fetch(url, {
			headers: { "User-Agent": "ioBroker-pwned-check/0.0.1" },
			signal: controller.signal,
		});
		return await res.text();
	} catch (err: any) {
		if (err?.name === "AbortError") throw new Error("Request timed out");
		throw err;
	} finally {
		clearTimeout(timer);
	}
}

class PwnedCheck extends utils.Adapter {
	private checkTimer: ReturnType<typeof setTimeout> | null = null;
	// Track previous state: key = "password:{service}" or "email:{label}", value = { isPwned, leakCount }
	private prevState: Map<string, { isPwned: boolean; leakCount?: number }> = new Map();

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

		const config = this.config as unknown as AdapterConfig;

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
		}

		for (const entry of emails) {
			if (!entry.email) {
				this.log.warn(`Email entry "${entry.email}" has no email, skipping`);
				continue;
			}
			await this.checkEmailEntry(entry);
		}

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
					try {
						(this as any).registerNotification(
							"system",
							"securityIssues",
							`[pwned-check] Password for "${entry.description}" found in ${leakCount} data breach(es)! Please change it immediately.`,
						);
					} catch {
						// notifications may not be available in all environments
					}
				} else if (prev.leakCount !== undefined && leakCount > prev.leakCount) {
					// Increasing leak count
					try {
						(this as any).registerNotification(
							"system",
							"securityIssues",
							`[pwned-check] Password for "${entry.description}" now found in ${leakCount} breaches (was ${prev.leakCount}).`,
						);
					} catch {
						// ignore
					}
				}
			} else if (prev?.isPwned) {
				// Cleared!
				this.log.info(`Password for "${entry.description}" is no longer found in breaches.`);
				try {
					(this as any).registerNotification(
						"system",
						"securityIssues",
						`[pwned-check] Security cleared: Password for "${entry.description}" is no longer found in known breaches.`,
					);
				} catch {
					// ignore
				}
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
				`https://api.xposedornot.com/v1/check-email/${encodeURIComponent(entry.email)}`,
			);
			let parsed: { breaches?: string[][]; status?: string; Error?: string };
			try {
				parsed = JSON.parse(body);
			} catch {
				this.log.error(`Invalid JSON from XposedOrNot for "${entry.email}": ${body}`);
				return;
			}

			let breachList: string[] = [];
			let isPwned = false;

			if (parsed.Error === "Not found") {
				isPwned = false;
				breachList = [];
			} else if (parsed.status === "success" && Array.isArray(parsed.breaches)) {
				// breaches is array of arrays: [["Dropbox","LinkedIn"]]
				for (const group of parsed.breaches) {
					if (Array.isArray(group)) {
						breachList.push(...group);
					}
				}
				isPwned = breachList.length > 0;
			}

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
				// Create/update per-breach leak DPs
				for (const service of breachList) {
					const safeService = normalizeId(service);
					await this.setObjectNotExistsAsync(`emails.${safeId}.leaks.${safeService}`, {
						type: "state",
						common: {
							name: service,
							role: "indicator",
							type: "boolean",
							read: true,
							write: false,
							def: false,
						},
						native: {},
					});
					await this.setStateAsync(`emails.${safeId}.leaks.${safeService}`, { val: true, ack: true });
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
					try {
						(this as any).registerNotification(
							"system",
							"securityIssues",
							`[pwned-check] Email "${entry.email}" found in ${breachList.length} data breach(es): ${breachList.join(", ")}`,
						);
					} catch {
						// ignore
					}
				}
			} else if (prev?.isPwned) {
				this.log.info(`Email "${entry.email}" is no longer found in breaches.`);
				try {
					(this as any).registerNotification(
						"system",
						"securityIssues",
						`[pwned-check] Security cleared: Email "${entry.email}" is no longer found in known breaches.`,
					);
				} catch {
					// ignore
				}
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

	/**
	 * Cleans up orphaned object trees for passwords/emails removed from config
	 *
	 * @param config - Current adapter configuration
	 */
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
		const theme = config.theme ?? "auto";

		const isDark = theme === "dark" || (theme === "auto" && false); // auto: default to light; could be extended with system.config check

		const bgColor = isDark ? "#1a1a2e" : "#f5f5f5";
		const cardBg = isDark ? "#16213e" : "#ffffff";
		const textColor = isDark ? "#e0e0e0" : "#212121";
		const borderColor = isDark ? "#0f3460" : "#e0e0e0";

		const safeCardBg = cardBg;
		const safeTextColor = textColor;

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
			const statusText = isPwned ? `PWNED (${leakCount} breaches)` : "SAFE";

			pwCards.push(`
				<div style="background:${safeCardBg};border:1px solid ${borderColor};border-radius:8px;padding:16px;display:flex;align-items:center;gap:16px;">
					${lockSvg}
					<div>
						<div style="font-weight:600;font-size:14px;color:${safeTextColor};">${escapeHtml(entry.description)}</div>
						<div style="font-size:12px;color:${statusColor};font-weight:500;">${statusText}</div>
					</div>
				</div>`);
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
			const statusText = isPwned ? `PWNED (${breachNames.join(", ") || "unknown"})` : "SAFE";

			emailCards.push(`
				<div style="background:${safeCardBg};border:1px solid ${borderColor};border-radius:8px;padding:16px;display:flex;align-items:center;gap:16px;">
					${lockSvg}
					<div>
						<div style="font-weight:600;font-size:14px;color:${safeTextColor};">${escapeHtml(entry.email)}</div>
						<div style="font-size:11px;color:#888;">${escapeHtml(entry.email)}</div>
						<div style="font-size:12px;color:${statusColor};font-weight:500;">${statusText}</div>
					</div>
				</div>`);
		}

		const html = `
<div style="font-family:sans-serif;background:${bgColor};padding:16px;border-radius:10px;color:${safeTextColor};">
	<h3 style="margin:0 0 12px 0;color:${safeTextColor};">Pwned Check</h3>
	${passwords.length > 0 ? `<div style="font-size:13px;font-weight:600;margin-bottom:8px;color:${safeTextColor};">Passwords</div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px;margin-bottom:16px;">${pwCards.join("")}</div>` : ""}
	${emails.length > 0 ? `<div style="font-size:13px;font-weight:600;margin-bottom:8px;color:${safeTextColor};">E-Mails</div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px;">${emailCards.join("")}</div>` : ""}
	${passwords.length === 0 && emails.length === 0 ? `<div style="color:#888;font-size:13px;">No entries configured.</div>` : ""}
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
