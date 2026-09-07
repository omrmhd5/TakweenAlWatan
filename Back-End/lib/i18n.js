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

function t(req, path) {
  const lang = getLang(req);
  const parts = path.split(".");
  let node = catalogs[lang];
  for (const part of parts) {
    node = node?.[part];
  }
  return typeof node === "string" ? node : path;
}

module.exports = { getLang, t };
