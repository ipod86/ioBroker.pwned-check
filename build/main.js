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
const TRANSLATIONS = {
  pwFound: {
    en: '[pwned-check] Password "%s" found in %n data breach(es)! Please change it immediately.',
    de: '[pwned-check] Passwort "%s" in %n Datenleck(s) gefunden! Bitte sofort \xE4ndern.',
    ru: '[pwned-check] \u041F\u0430\u0440\u043E\u043B\u044C "%s" \u043D\u0430\u0439\u0434\u0435\u043D \u0432 %n \u0443\u0442\u0435\u0447\u043A\u0430\u0445 \u0434\u0430\u043D\u043D\u044B\u0445! \u041D\u0435\u043C\u0435\u0434\u043B\u0435\u043D\u043D\u043E \u0441\u043C\u0435\u043D\u0438\u0442\u0435 \u0435\u0433\u043E.',
    pt: '[pwned-check] Senha "%s" encontrada em %n viola\xE7\xE3o(\xF5es) de dados! Altere-a imediatamente.',
    nl: '[pwned-check] Wachtwoord "%s" gevonden in %n datalek(ken)! Verander het onmiddellijk.',
    fr: '[pwned-check] Mot de passe "%s" trouv\xE9 dans %n violation(s) de donn\xE9es ! Changez-le imm\xE9diatement.',
    it: '[pwned-check] Password "%s" trovata in %n violazione/i dei dati! Cambiarla immediatamente.',
    es: '[pwned-check] Contrase\xF1a "%s" encontrada en %n filtraci\xF3n(es) de datos. \xA1C\xE1mbiela de inmediato!',
    pl: '[pwned-check] Has\u0142o "%s" znalezione w %n wycieku(ach) danych! Zmie\u0144 je natychmiast.',
    uk: '[pwned-check] \u041F\u0430\u0440\u043E\u043B\u044C "%s" \u0437\u043D\u0430\u0439\u0434\u0435\u043D\u043E \u0432 %n \u0432\u0438\u0442\u043E\u043A\u0443(\u0430\u0445) \u0434\u0430\u043D\u0438\u0445! \u041D\u0435\u0433\u0430\u0439\u043D\u043E \u0437\u043C\u0456\u043D\u0456\u0442\u044C \u0439\u043E\u0433\u043E.',
    "zh-cn": '[pwned-check] \u5BC6\u7801 "%s" \u5DF2\u5728 %n \u6B21\u6570\u636E\u6CC4\u9732\u4E2D\u53D1\u73B0\uFF01\u8BF7\u7ACB\u5373\u66F4\u6539\u3002'
  },
  pwIncreased: {
    en: '[pwned-check] Password "%s" now found in %n breaches (was %p).',
    de: '[pwned-check] Passwort "%s" jetzt in %n Lecks gefunden (vorher %p).',
    ru: '[pwned-check] \u041F\u0430\u0440\u043E\u043B\u044C "%s" \u0442\u0435\u043F\u0435\u0440\u044C \u043D\u0430\u0439\u0434\u0435\u043D \u0432 %n \u0443\u0442\u0435\u0447\u043A\u0430\u0445 (\u0440\u0430\u043D\u0435\u0435 %p).',
    pt: '[pwned-check] Senha "%s" agora encontrada em %n viola\xE7\xF5es (antes %p).',
    nl: '[pwned-check] Wachtwoord "%s" nu gevonden in %n lekken (was %p).',
    fr: '[pwned-check] Mot de passe "%s" maintenant dans %n fuites (avant %p).',
    it: '[pwned-check] Password "%s" ora in %n violazioni (prima %p).',
    es: '[pwned-check] Contrase\xF1a "%s" ahora en %n filtraciones (antes %p).',
    pl: '[pwned-check] Has\u0142o "%s" teraz w %n wyciekach (wcze\u015Bniej %p).',
    uk: '[pwned-check] \u041F\u0430\u0440\u043E\u043B\u044C "%s" \u0442\u0435\u043F\u0435\u0440 \u0443 %n \u0432\u0438\u0442\u043E\u043A\u0430\u0445 (\u0440\u0430\u043D\u0456\u0448\u0435 %p).',
    "zh-cn": '[pwned-check] \u5BC6\u7801 "%s" \u73B0\u5728\u5728 %n \u6B21\u6CC4\u9732\u4E2D\u53D1\u73B0\uFF08\u4E4B\u524D %p \u6B21\uFF09\u3002'
  },
  pwCleared: {
    en: '[pwned-check] Security cleared: Password "%s" is no longer found in known breaches.',
    de: '[pwned-check] Sicherheit wiederhergestellt: Passwort "%s" nicht mehr in bekannten Lecks gefunden.',
    ru: '[pwned-check] \u0411\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E\u0441\u0442\u044C \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0430: \u043F\u0430\u0440\u043E\u043B\u044C "%s" \u0431\u043E\u043B\u044C\u0448\u0435 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D \u0432 \u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B\u0445 \u0443\u0442\u0435\u0447\u043A\u0430\u0445.',
    pt: '[pwned-check] Seguran\xE7a restaurada: Senha "%s" n\xE3o encontrada em viola\xE7\xF5es conhecidas.',
    nl: '[pwned-check] Beveiliging hersteld: Wachtwoord "%s" niet meer gevonden in bekende lekken.',
    fr: `[pwned-check] S\xE9curit\xE9 r\xE9tablie : le mot de passe "%s" n'est plus dans les fuites connues.`,
    it: '[pwned-check] Sicurezza ripristinata: la password "%s" non \xE8 pi\xF9 trovata in violazioni note.',
    es: '[pwned-check] Seguridad restablecida: la contrase\xF1a "%s" ya no aparece en filtraciones conocidas.',
    pl: '[pwned-check] Bezpiecze\u0144stwo przywr\xF3cone: has\u0142o "%s" nie jest ju\u017C w znanych wyciekach.',
    uk: '[pwned-check] \u0411\u0435\u0437\u043F\u0435\u043A\u0430 \u0432\u0456\u0434\u043D\u043E\u0432\u043B\u0435\u043D\u0430: \u043F\u0430\u0440\u043E\u043B\u044C "%s" \u0431\u0456\u043B\u044C\u0448\u0435 \u043D\u0435 \u0437\u043D\u0430\u0439\u0434\u0435\u043D\u043E \u0443 \u0432\u0456\u0434\u043E\u043C\u0438\u0445 \u0432\u0438\u0442\u043E\u043A\u0430\u0445.',
    "zh-cn": '[pwned-check] \u5B89\u5168\u5DF2\u6062\u590D\uFF1A\u5BC6\u7801 "%s" \u4E0D\u518D\u51FA\u73B0\u5728\u5DF2\u77E5\u6CC4\u9732\u4E2D\u3002'
  },
  emailFound: {
    en: '[pwned-check] Email "%s" found in %n data breach(es): %b',
    de: '[pwned-check] E-Mail "%s" in %n Datenleck(s) gefunden: %b',
    ru: '[pwned-check] E-mail "%s" \u043D\u0430\u0439\u0434\u0435\u043D \u0432 %n \u0443\u0442\u0435\u0447\u043A\u0430\u0445 \u0434\u0430\u043D\u043D\u044B\u0445: %b',
    pt: '[pwned-check] E-mail "%s" encontrado em %n viola\xE7\xE3o(\xF5es): %b',
    nl: '[pwned-check] E-mail "%s" gevonden in %n datalek(ken): %b',
    fr: '[pwned-check] E-mail "%s" trouv\xE9 dans %n violation(s) de donn\xE9es : %b',
    it: '[pwned-check] E-mail "%s" trovata in %n violazione/i: %b',
    es: '[pwned-check] E-mail "%s" encontrado en %n filtraci\xF3n(es): %b',
    pl: '[pwned-check] E-mail "%s" znaleziony w %n wycieku(ach): %b',
    uk: '[pwned-check] E-mail "%s" \u0437\u043D\u0430\u0439\u0434\u0435\u043D\u043E \u0432 %n \u0432\u0438\u0442\u043E\u043A\u0443(\u0430\u0445): %b',
    "zh-cn": '[pwned-check] \u90AE\u7BB1 "%s" \u5728 %n \u6B21\u6570\u636E\u6CC4\u9732\u4E2D\u53D1\u73B0\uFF1A%b'
  },
  emailCleared: {
    en: '[pwned-check] Security cleared: Email "%s" is no longer found in known breaches.',
    de: '[pwned-check] Sicherheit wiederhergestellt: E-Mail "%s" nicht mehr in bekannten Lecks gefunden.',
    ru: '[pwned-check] \u0411\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E\u0441\u0442\u044C \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0430: e-mail "%s" \u0431\u043E\u043B\u044C\u0448\u0435 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D \u0432 \u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B\u0445 \u0443\u0442\u0435\u0447\u043A\u0430\u0445.',
    pt: '[pwned-check] Seguran\xE7a restaurada: E-mail "%s" n\xE3o encontrado em viola\xE7\xF5es conhecidas.',
    nl: '[pwned-check] Beveiliging hersteld: E-mail "%s" niet meer gevonden in bekende lekken.',
    fr: `[pwned-check] S\xE9curit\xE9 r\xE9tablie : l'e-mail "%s" n'est plus dans les fuites connues.`,
    it: `[pwned-check] Sicurezza ripristinata: l'e-mail "%s" non \xE8 pi\xF9 in violazioni note.`,
    es: '[pwned-check] Seguridad restablecida: el e-mail "%s" ya no aparece en filtraciones conocidas.',
    pl: '[pwned-check] Bezpiecze\u0144stwo przywr\xF3cone: e-mail "%s" nie jest ju\u017C w znanych wyciekach.',
    uk: '[pwned-check] \u0411\u0435\u0437\u043F\u0435\u043A\u0430 \u0432\u0456\u0434\u043D\u043E\u0432\u043B\u0435\u043D\u0430: e-mail "%s" \u0431\u0456\u043B\u044C\u0448\u0435 \u043D\u0435 \u0437\u043D\u0430\u0439\u0434\u0435\u043D\u043E \u0443 \u0432\u0456\u0434\u043E\u043C\u0438\u0445 \u0432\u0438\u0442\u043E\u043A\u0430\u0445.',
    "zh-cn": '[pwned-check] \u5B89\u5168\u5DF2\u6062\u590D\uFF1A\u90AE\u7BB1 "%s" \u4E0D\u518D\u51FA\u73B0\u5728\u5DF2\u77E5\u6CC4\u9732\u4E2D\u3002'
  }
};
function t(key, lang, vars = {}) {
  var _a, _b, _c, _d, _e, _f, _g, _h;
  const tpl = (_d = (_c = (_a = TRANSLATIONS[key]) == null ? void 0 : _a[lang]) != null ? _c : (_b = TRANSLATIONS[key]) == null ? void 0 : _b.en) != null ? _d : key;
  return tpl.replace("%s", (_e = vars.s) != null ? _e : "").replace("%n", String((_f = vars.n) != null ? _f : "")).replace("%p", String((_g = vars.p) != null ? _g : "")).replace("%b", (_h = vars.b) != null ? _h : "");
}
function normalizeId(str) {
  return str.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();
}
async function httpsGet(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15e3);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "ioBroker-pwned-check/0.0.1" },
      signal: controller.signal
    });
    return await res.text();
  } catch (err) {
    if ((err == null ? void 0 : err.name) === "AbortError") {
      throw new Error("Request timed out");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
class PwnedCheck extends utils.Adapter {
  checkTimer = null;
  prevState = /* @__PURE__ */ new Map();
  lang = "en";
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
    var _a, _b;
    void this.setState("info.connection", { val: false, ack: true });
    try {
      const sysConfig = await this.getForeignObjectAsync("system.config");
      const syslang = (_a = sysConfig == null ? void 0 : sysConfig.common) == null ? void 0 : _a.language;
      if (syslang && syslang in TRANSLATIONS.pwFound) {
        this.lang = syslang;
      }
    } catch {
    }
    const config = this.config;
    await this.cleanupOrphanedObjects(config);
    await this.runAllChecks(config);
    const intervalHours = (_b = config.checkInterval) != null ? _b : 24;
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
    void this.setState("info.connection", { val: true, ack: true });
    const passwords = (_a = config.passwords) != null ? _a : [];
    const emails = (_b = config.emails) != null ? _b : [];
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
  async checkPasswordEntry(entry) {
    const safeId = normalizeId(entry.description);
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
        common: { name: entry.description },
        native: {}
      });
      await this.setObjectNotExistsAsync(`passwords.${safeId}.isPwned`, {
        type: "state",
        common: {
          name: `${entry.description} \u2014 is pwned`,
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
          name: `${entry.description} \u2014 leak count`,
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
          name: `${entry.description} \u2014 last check`,
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
          this.log.warn(`Password for "${entry.description}" found in ${leakCount} breaches!`);
          try {
            this.registerNotification(
              "system",
              "securityIssues",
              t("pwFound", this.lang, { s: entry.description, n: leakCount })
            );
          } catch {
          }
        } else if (prev.leakCount !== void 0 && leakCount > prev.leakCount) {
          try {
            this.registerNotification(
              "system",
              "securityIssues",
              t("pwIncreased", this.lang, { s: entry.description, n: leakCount, p: prev.leakCount })
            );
          } catch {
          }
        }
      } else if (prev == null ? void 0 : prev.isPwned) {
        this.log.info(`Password for "${entry.description}" is no longer found in breaches.`);
        try {
          this.registerNotification(
            "system",
            "securityIssues",
            t("pwCleared", this.lang, { s: entry.description })
          );
        } catch {
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
  async checkEmailEntry(entry) {
    const safeId = normalizeId(entry.email);
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
        common: { name: entry.email },
        native: {}
      });
      await this.setObjectNotExistsAsync(`emails.${safeId}.isPwned`, {
        type: "state",
        common: {
          name: `${entry.email} \u2014 is pwned`,
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
          name: `${entry.email} \u2014 last check`,
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
              name: service,
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
            `Email "${entry.email}" found in ${breachList.length} breach(es): ${breachList.join(", ")}`
          );
          try {
            this.registerNotification(
              "system",
              "securityIssues",
              t("emailFound", this.lang, {
                s: entry.email,
                n: breachList.length,
                b: breachList.join(", ")
              })
            );
          } catch {
          }
        }
      } else if (prev == null ? void 0 : prev.isPwned) {
        this.log.info(`Email "${entry.email}" is no longer found in breaches.`);
        try {
          this.registerNotification(
            "system",
            "securityIssues",
            t("emailCleared", this.lang, { s: entry.email })
          );
        } catch {
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
    const configPasswordIds = new Set(((_a = config.passwords) != null ? _a : []).map((p) => normalizeId(p.description)));
    const configEmailIds = new Set(((_b = config.emails) != null ? _b : []).map((e) => normalizeId(e.email)));
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
    var _a, _b, _c, _d, _e, _f;
    const passwords = (_a = config.passwords) != null ? _a : [];
    const emails = (_b = config.emails) != null ? _b : [];
    const theme = (_c = config.theme) != null ? _c : "light";
    const bgOpacity = (_d = config.bgOpacity) != null ? _d : 100;
    const cardOpacity = (_e = config.cardOpacity) != null ? _e : 100;
    const fontSize = (_f = config.fontSize) != null ? _f : 14;
    const isDark = theme === "dark";
    const bgRgb = isDark ? "26,26,46" : "245,245,245";
    const cardRgb = isDark ? "22,33,62" : "255,255,255";
    const textColor = isDark ? "#e0e0e0" : "#212121";
    const borderColor = isDark ? "#0f3460" : "#e0e0e0";
    const bgColor = `rgba(${bgRgb},${(bgOpacity / 100).toFixed(2)})`;
    const safeCardBg = `rgba(${cardRgb},${(cardOpacity / 100).toFixed(2)})`;
    const safeTextColor = textColor;
    const pwCards = [];
    for (const entry of passwords) {
      const safeId = normalizeId(entry.description);
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
						<div style="font-weight:600;font-size:14px;color:${safeTextColor};">${escapeHtml(entry.description)}</div>
						<div style="font-size:12px;color:${statusColor};font-weight:500;">${statusText}</div>
					</div>
				</div>`);
    }
    const emailCards = [];
    for (const entry of emails) {
      const safeId = normalizeId(entry.email);
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
						<div style="font-weight:600;font-size:14px;color:${safeTextColor};">${escapeHtml(entry.email)}</div>
						<div style="font-size:11px;color:#888;">${escapeHtml(entry.email)}</div>
						<div style="font-size:12px;color:${statusColor};font-weight:500;">${statusText}</div>
					</div>
				</div>`);
    }
    const html = `
<div style="font-family:sans-serif;font-size:${fontSize}px;background:${bgColor};padding:16px;border-radius:10px;color:${safeTextColor};">
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
