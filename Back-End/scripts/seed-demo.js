require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../Models/User");
const PestControlReport = require("../Models/PestControlReport");

const LOCAL_URI = "mongodb://127.0.0.1:27017/takween-al-watan-demo";

function pickUri() {
  const mode = process.argv.includes("--remote") ? "remote" : "local";
  if (mode === "remote") {
    const uri = process.env.MONGO_URI_REMOTE || process.env.MONGO_URI;
    if (!uri || uri.includes("127.0.0.1") || uri.includes("localhost")) {
      throw new Error(
        "Remote seed needs MONGO_URI_REMOTE or MONGO_URI pointing at Atlas (takween-al-watan-demo)."
      );
    }
    return { mode, uri };
  }
  return {
    mode,
    uri: process.env.MONGO_URI_LOCAL || LOCAL_URI,
  };
}

const siteTypes = [
  "المواقع المستكشفة",
  "المواقع السلبية",
  "المواقع الإيجابية",
  "المواقع الدائمة",
  "تجمعات مياه",
  "سقيا الطيور",
  "مناهل مكشوفه",
  "احواش مهجورة",
  "مباني تحت الانشاء",
  "حدائق عامة",
  "مرافق عامة",
  "الاستراحات",
  "المساجد",
  "حوض اسمنتي",
  "الإطارات",
  "مزهريات",
  "تسريبات مياه",
  "البرادات",
  "مجاري تصريف",
  "الحالات المباشرة",
  "بلاغات 940",
];

const municipalities = [
  { name: "العزيزية", district: "العزيزية" },
  { name: "المعابدة", district: "المعابدة" },
  { name: "الشرائع", district: "الشرائع" },
  { name: "العتيبة", district: "العتيبية" },
  { name: "الزيمة", district: "حنين" },
  { name: "المشاعر المقدسة", district: "منى" },
];

const workers = ["أحمد محمد", "خالد العتيبي", "سالم القرشي"];
const controlTypes = ["يرقي", "بالغ", "مكافحة وقائية"];

function countsFor(seed) {
  const siteCounts = {};
  siteTypes.forEach((type, i) => {
    siteCounts[type] = ((seed + i * 3) % 12) + (i % 4 === 0 ? 4 : 1);
  });
  return siteCounts;
}

function isoDate(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}

async function seed() {
  const { mode, uri } = pickUri();
  console.log(`Seeding ${mode} database...`);
  await mongoose.connect(uri);
  await User.deleteMany({});
  await PestControlReport.deleteMany({});

  const password = await bcrypt.hash("admin123", 12);
  await User.create({ username: "admin", password });

  const reports = [];
  for (let day = 0; day < 10; day += 1) {
    municipalities.forEach((muni, mIndex) => {
      if (day % 2 === 1 && mIndex > 3) return;
      const siteCounts = countsFor(day * 10 + mIndex);
      const totalSites = Object.values(siteCounts).reduce((a, b) => a + b, 0);
      reports.push({
        date: isoDate(day),
        municipality: muni.name,
        district: muni.district,
        workerName: workers[(day + mIndex) % workers.length],
        controlType: controlTypes[(day + mIndex) % controlTypes.length],
        siteCounts,
        bgTraps: {
          isPositive: (day + mIndex) % 3 === 0,
          count: (day + mIndex) % 3 === 0 ? 2 + (mIndex % 3) : 0,
        },
        smartTraps: {
          isPositive: (day + mIndex) % 4 === 0,
          count: (day + mIndex) % 4 === 0 ? 1 + (day % 2) : 0,
        },
        comment: day === 0 ? "Demo seed report" : "",
        coordinates: {
          latitude: 21.3891 + mIndex * 0.01,
          longitude: 39.8579 + day * 0.002,
        },
        totalSites,
      });
    });
  }

  await PestControlReport.insertMany(reports);
  console.log(
    `Wiped and seeded ${mode}: 1 admin user (admin / admin123), ${reports.length} reports.`
  );
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
