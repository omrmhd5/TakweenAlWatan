const ar = require("../locales/ar.json");
const en = require("../locales/en.json");

const catalogs = { ar, en };

function getLang(req) {
  const header = (req.headers["x-language"] || req.headers["accept-language"] || "ar")
    .toString()
    .slice(0, 2)
    .toLowerCase();
  return header === "en" ? "en" : "ar";
}

function lookup(lang, path) {
  const parts = path.split(".");
  let node = catalogs[lang];
  for (const part of parts) {
    node = node?.[part];
  }
  return node;
}

function t(req, path, vars = {}) {
  const lang = getLang(req);
  let node = lookup(lang, path);
  if (typeof node !== "string") node = lookup("ar", path);
  if (typeof node !== "string") return path;
  return node.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    vars[key] == null ? "" : String(vars[key])
  );
}

function label(req, group, value) {
  if (!value) return "";
  const path = `data.${group}.${value}`;
  const out = t(req, path);
  return out === path ? value : out;
}

function localeTag(req) {
  return getLang(req) === "en" ? "en-GB" : "ar-SA";
}

module.exports = { getLang, t, label, localeTag };
