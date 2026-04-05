"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var utils = __toESM(require("@iobroker/adapter-core"));
var import_https = __toESM(require("https"));
function normalizeId(str) {
  return str.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();
}
function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const options = new URL(url);
    const req = import_https.default.get(
      {
        hostname: options.hostname,
        path: options.pathname + options.search,
        headers: {
          "User-Agent": "ioBroker-pwned-check/0.0.1"
        }
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk.toString();
        });
        res.on("end", () => resolve(data));
      }
    );
    req.on("error", reject);
    req.setTimeout(15e3, () => {
      req.destroy(new Error("Request timed out"));
    });
  });
}
class PwnedCheck extends utils.Adapter {
  checkTimer = null;
  // Track previous state: key = "password:{service}" or "email:{label}", value = { isPwned, leakCount }
  prevState = /* @__PURE__ */ new Map();
  constructor(options = {}) {
    super({
      ...options,
      name: "pwned-check"
    });
    this.on("ready", this.onReady.bind(this));
    this.on("message", this.onMessage.bind(this));
    this.on("unload", this.onUnload.bind(this));
  }
  /**
   * Adapter ready handler — runs full check and sets up interval
   */
  async onReady() {
    var _a;
    this.setState("info.connection", { val: false, ack: true });
    const config = this.config;
    await this.cleanupOrphanedObjects(config);
    await this.runAllChecks(config);
    const intervalHours = (_a = config.checkInterval) != null ? _a : 24;
    const intervalMs = intervalHours * 60 * 60 * 1e3;
    this.checkTimer = setInterval(async () => {
      await this.runAllChecks(this.config);
    }, intervalMs);
  }
  /**
   * Message handler for sendTo commands
   *
   * @param obj - Message object
   */
  async onMessage(obj) {
    if (obj.command === "checkNow") {
      this.log.info("Manual check triggered via sendTo");
      await this.runAllChecks(this.config);
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
  onUnload(callback) {
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
  async runAllChecks(config) {
    var _a, _b;
    this.setState("info.connection", { val: true, ack: true });
    const passwords = (_a = config.passwords) != null ? _a : [];
    const emails = (_b = config.emails) != null ? _b : [];
    for (const entry of passwords) {
      if (!entry.hash || entry.hash.length < 6) {
        this.log.warn(`Password entry "${entry.service}" has no valid hash, skipping`);
        continue;
      }
      await this.checkPasswordEntry(entry);
    }
    for (const entry of emails) {
      if (!entry.email) {
        this.log.warn(`Email entry "${entry.label}" has no email, skipping`);
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
  async checkPasswordEntry(entry) {
    const safeId = normalizeId(entry.service);
    const prefix = entry.hash.substring(0, 5).toUpperCase();
    const suffix = entry.hash.substring(5).toUpperCase();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    try {
      const body = await httpsGet(`https://api.pwnedpasswords.com/range/${prefix}`);
      const lines = body.split("\n");
      let leakCount = 0;
      let found = false;
      for (const line of lines) {
        const [lineSuffix, countStr] = line.trim().split(":");
        if (lineSuffix && lineSuffix.toUpperCase() === suffix) {
          leakCount = parseInt(countStr != null ? countStr : "0", 10) || 0;
          found = true;
          break;
        }
      }
      const isPwned = found && leakCount > 0;
      await this.setObjectNotExistsAsync(`passwords.${safeId}`, {
        type: "channel",
        common: { name: entry.service },
        native: {}
      });
      await this.setObjectNotExistsAsync(`passwords.${safeId}.isPwned`, {
        type: "state",
        common: {
          name: `${entry.service} \u2014 is pwned`,
          role: "indicator.alarm",
          type: "boolean",
          read: true,
          write: false,
          def: false
        },
        native: {}
      });
      await this.setObjectNotExistsAsync(`passwords.${safeId}.leakCount`, {
        type: "state",
        common: {
          name: `${entry.service} \u2014 leak count`,
          role: "value",
          type: "number",
          read: true,
          write: false,
          def: 0
        },
        native: {}
      });
      await this.setObjectNotExistsAsync(`passwords.${safeId}.lastCheck`, {
        type: "state",
        common: {
          name: `${entry.service} \u2014 last check`,
          role: "date",
          type: "string",
          read: true,
          write: false,
          def: ""
        },
        native: {}
      });
      await this.setStateAsync(`passwords.${safeId}.isPwned`, { val: isPwned, ack: true });
      await this.setStateAsync(`passwords.${safeId}.leakCount`, { val: leakCount, ack: true });
      await this.setStateAsync(`passwords.${safeId}.lastCheck`, { val: now, ack: true });
      const prevKey = `password:${safeId}`;
      const prev = this.prevState.get(prevKey);
      if (isPwned) {
        if (!(prev == null ? void 0 : prev.isPwned)) {
          this.log.warn(`Password for "${entry.service}" found in ${leakCount} breaches!`);
          try {
            this.registerNotification(
              "system",
              "securityIssues",
              `[pwned-check] Password for "${entry.service}" found in ${leakCount} data breach(es)! Please change it immediately.`
            );
          } catch {
          }
        } else if (prev.leakCount !== void 0 && leakCount > prev.leakCount) {
          try {
            this.registerNotification(
              "system",
              "securityIssues",
              `[pwned-check] Password for "${entry.service}" now found in ${leakCount} breaches (was ${prev.leakCount}).`
            );
          } catch {
          }
        }
      } else if (prev == null ? void 0 : prev.isPwned) {
        this.log.info(`Password for "${entry.service}" is no longer found in breaches.`);
        try {
          this.registerNotification(
            "system",
            "securityIssues",
            `[pwned-check] Security cleared: Password for "${entry.service}" is no longer found in known breaches.`
          );
        } catch {
        }
      }
      this.prevState.set(prevKey, { isPwned, leakCount });
      this.log.debug(`Password check for "${entry.service}": isPwned=${isPwned}, leakCount=${leakCount}`);
    } catch (err) {
      this.log.error(`Error checking password for "${entry.service}": ${String(err)}`);
    }
  }
  /**
   * Checks a single email address against XposedOrNot API
   *
   * @param entry - The email entry
   */
  async checkEmailEntry(entry) {
    const safeId = normalizeId(entry.label);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    try {
      const body = await httpsGet(
        `https://api.xposedornot.com/v1/check-email/${encodeURIComponent(entry.email)}`
      );
      let parsed;
      try {
        parsed = JSON.parse(body);
      } catch {
        this.log.error(`Invalid JSON from XposedOrNot for "${entry.email}": ${body}`);
        return;
      }
      let breachList = [];
      let isPwned = false;
      if (parsed.Error === "Not found") {
        isPwned = false;
        breachList = [];
      } else if (parsed.status === "success" && Array.isArray(parsed.breaches)) {
        for (const group of parsed.breaches) {
          if (Array.isArray(group)) {
            breachList.push(...group);
          }
        }
        isPwned = breachList.length > 0;
      }
      await this.setObjectNotExistsAsync(`emails.${safeId}`, {
        type: "channel",
        common: { name: entry.label },
        native: {}
      });
      await this.setObjectNotExistsAsync(`emails.${safeId}.isPwned`, {
        type: "state",
        common: {
          name: `${entry.label} \u2014 is pwned`,
          role: "indicator.alarm",
          type: "boolean",
          read: true,
          write: false,
          def: false
        },
        native: {}
      });
      await this.setObjectNotExistsAsync(`emails.${safeId}.lastCheck`, {
        type: "state",
        common: {
          name: `${entry.label} \u2014 last check`,
          role: "date",
          type: "string",
          read: true,
          write: false,
          def: ""
        },
        native: {}
      });
      await this.setStateAsync(`emails.${safeId}.isPwned`, { val: isPwned, ack: true });
      await this.setStateAsync(`emails.${safeId}.lastCheck`, { val: now, ack: true });
      if (isPwned) {
        for (const service of breachList) {
          const safeService = normalizeId(service);
          await this.setObjectNotExistsAsync(`emails.${safeId}.leaks.${safeService}`, {
            type: "state",
            common: {
              name: `${entry.label} \u2014 leaked in ${service}`,
              role: "indicator",
              type: "boolean",
              read: true,
              write: false,
              def: false
            },
            native: {}
          });
          await this.setStateAsync(`emails.${safeId}.leaks.${safeService}`, { val: true, ack: true });
        }
      } else {
        await this.deleteLeakChildren(safeId);
      }
      const prevKey = `email:${safeId}`;
      const prev = this.prevState.get(prevKey);
      if (isPwned) {
        if (!(prev == null ? void 0 : prev.isPwned)) {
          this.log.warn(
            `Email "${entry.label}" found in ${breachList.length} breach(es): ${breachList.join(", ")}`
          );
          for (const service of breachList) {
            try {
              this.registerNotification(
                "system",
                "securityIssues",
                `[pwned-check] Email "${entry.label}" found in data breach: ${service}`
              );
            } catch {
            }
          }
        }
      } else if (prev == null ? void 0 : prev.isPwned) {
        this.log.info(`Email "${entry.label}" is no longer found in breaches.`);
        try {
          this.registerNotification(
            "system",
            "securityIssues",
            `[pwned-check] Security cleared: Email "${entry.label}" is no longer found in known breaches.`
          );
        } catch {
        }
      }
      this.prevState.set(prevKey, { isPwned });
      this.log.debug(`Email check for "${entry.label}": isPwned=${isPwned}, breaches=${breachList.join(",")}`);
    } catch (err) {
      this.log.error(`Error checking email for "${entry.label}": ${String(err)}`);
    }
  }
  /**
   * Deletes all leaks.* child states for a given email safeId
   *
   * @param safeId - Normalized email label ID
   */
  async deleteLeakChildren(safeId) {
    try {
      const objects = await this.getObjectViewAsync("system", "state", {
        startkey: `${this.namespace}.emails.${safeId}.leaks.`,
        endkey: `${this.namespace}.emails.${safeId}.leaks.\u9999`
      });
      if (objects == null ? void 0 : objects.rows) {
        for (const row of objects.rows) {
          const id = row.id.replace(`${this.namespace}.`, "");
          await this.delObjectAsync(id);
        }
      }
    } catch {
    }
  }
  /**
   * Cleans up orphaned object trees for passwords/emails removed from config
   *
   * @param config - Current adapter configuration
   */
  async cleanupOrphanedObjects(config) {
    var _a, _b;
    const configPasswordIds = new Set(((_a = config.passwords) != null ? _a : []).map((p) => normalizeId(p.service)));
    const configEmailIds = new Set(((_b = config.emails) != null ? _b : []).map((e) => normalizeId(e.label)));
    try {
      const pwObjects = await this.getObjectViewAsync("system", "channel", {
        startkey: `${this.namespace}.passwords.`,
        endkey: `${this.namespace}.passwords.\u9999`
      });
      if (pwObjects == null ? void 0 : pwObjects.rows) {
        for (const row of pwObjects.rows) {
          const fullId = row.id;
          const parts = fullId.split(".");
          const channelName = parts[parts.length - 1];
          if (!configPasswordIds.has(channelName)) {
            this.log.info(`Removing orphaned password object tree: ${channelName}`);
            await this.delObjectAsync(`passwords.${channelName}`, { recursive: true });
          }
        }
      }
    } catch {
    }
    try {
      const emailObjects = await this.getObjectViewAsync("system", "channel", {
        startkey: `${this.namespace}.emails.`,
        endkey: `${this.namespace}.emails.\u9999`
      });
      if (emailObjects == null ? void 0 : emailObjects.rows) {
        for (const row of emailObjects.rows) {
          const fullId = row.id;
          const parts = fullId.split(".");
          const channelName = parts[parts.length - 1];
          if (!configEmailIds.has(channelName) && channelName !== "leaks") {
            this.log.info(`Removing orphaned email object tree: ${channelName}`);
            await this.delObjectAsync(`emails.${channelName}`, { recursive: true });
          }
        }
      }
    } catch {
    }
  }
  /**
   * Updates the visualisation HTML datapoint
   *
   * @param config - Adapter configuration
   */
  async updateVisualisation(config) {
    var _a, _b, _c;
    const passwords = (_a = config.passwords) != null ? _a : [];
    const emails = (_b = config.emails) != null ? _b : [];
    const theme = (_c = config.theme) != null ? _c : "auto";
    const isDark = theme === "dark" || theme === "auto" && false;
    const bgColor = isDark ? "#1a1a2e" : "#f5f5f5";
    const cardBg = isDark ? "#16213e" : "#ffffff";
    const textColor = isDark ? "#e0e0e0" : "#212121";
    const borderColor = isDark ? "#0f3460" : "#e0e0e0";
    const safeCardBg = cardBg;
    const safeTextColor = textColor;
    const pwCards = [];
    for (const entry of passwords) {
      const safeId = normalizeId(entry.service);
      let isPwned = false;
      let leakCount = 0;
      try {
        const isPwnedState = await this.getStateAsync(`passwords.${safeId}.isPwned`);
        const leakCountState = await this.getStateAsync(`passwords.${safeId}.leakCount`);
        isPwned = (isPwnedState == null ? void 0 : isPwnedState.val) === true;
        leakCount = typeof (leakCountState == null ? void 0 : leakCountState.val) === "number" ? leakCountState.val : 0;
      } catch {
      }
      const lockSvg = isPwned ? `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#e53935" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>` : `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#43a047" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`;
      const statusColor = isPwned ? "#e53935" : "#43a047";
      const statusText = isPwned ? `PWNED (${leakCount} breaches)` : "SAFE";
      pwCards.push(`
				<div style="background:${safeCardBg};border:1px solid ${borderColor};border-radius:8px;padding:16px;display:flex;align-items:center;gap:16px;">
					${lockSvg}
					<div>
						<div style="font-weight:600;font-size:14px;color:${safeTextColor};">${escapeHtml(entry.service)}</div>
						<div style="font-size:12px;color:${statusColor};font-weight:500;">${statusText}</div>
					</div>
				</div>`);
    }
    const emailCards = [];
    for (const entry of emails) {
      const safeId = normalizeId(entry.label);
      let isPwned = false;
      const breachNames = [];
      try {
        const isPwnedState = await this.getStateAsync(`emails.${safeId}.isPwned`);
        isPwned = (isPwnedState == null ? void 0 : isPwnedState.val) === true;
        if (isPwned) {
          const leakObjects = await this.getObjectViewAsync("system", "state", {
            startkey: `${this.namespace}.emails.${safeId}.leaks.`,
            endkey: `${this.namespace}.emails.${safeId}.leaks.\u9999`
          });
          if (leakObjects == null ? void 0 : leakObjects.rows) {
            for (const row of leakObjects.rows) {
              const parts = row.id.split(".");
              breachNames.push(parts[parts.length - 1].replace(/_/g, " "));
            }
          }
        }
      } catch {
      }
      const lockSvg = isPwned ? `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#e53935" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>` : `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#43a047" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`;
      const statusColor = isPwned ? "#e53935" : "#43a047";
      const statusText = isPwned ? `PWNED (${breachNames.join(", ") || "unknown"})` : "SAFE";
      emailCards.push(`
				<div style="background:${safeCardBg};border:1px solid ${borderColor};border-radius:8px;padding:16px;display:flex;align-items:center;gap:16px;">
					${lockSvg}
					<div>
						<div style="font-weight:600;font-size:14px;color:${safeTextColor};">${escapeHtml(entry.label)}</div>
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
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
if (require.main !== module) {
  module.exports = (options) => new PwnedCheck(options);
} else {
  (() => new PwnedCheck())();
}
//# sourceMappingURL=main.js.map
