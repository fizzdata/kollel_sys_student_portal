/*
  Weekly parsha (sedra) for the Shabbos of a given week.
  JS port of backend/app/Support/Hebrew/HebrewCalendar.php — hebcal's
  table-driven sedra algorithm (by year type), diaspora schedule.
*/
import { G2Hnumber, H2G } from "./Gregorian_to_Hebrew.js";

const PARSHIOT = [
  "בראשית", "נח", "לך־לך", "וירא", "חיי שרה", "תולדות", "ויצא", "וישלח", "וישב", "מקץ",
  "ויגש", "ויחי", "שמות", "וארא", "בא", "בשלח", "יתרו", "משפטים", "תרומה", "תצוה",
  "כי תשא", "ויקהל", "פקודי", "ויקרא", "צו", "שמיני", "תזריע", "מצורע", "אחרי מות", "קדשים",
  "אמור", "בהר", "בחקתי", "במדבר", "נשא", "בהעלתך", "שלח", "קורח", "חקת", "בלק",
  "פינחס", "מטות", "מסעי", "דברים", "ואתחנן", "עקב", "ראה", "שופטים", "כי תצא", "כי תבוא",
  "נצבים", "וילך", "האזינו",
];

const CHAGIM = {
  m: "ראש השנה",
  d: "יום כיפור",
  w: "סוכות",
  g: 'חוה"מ סוכות',
  p: "שמיני עצרת",
  v: "סוכות",
  b: "פסח",
  A: 'חוה"מ פסח',
  L: "שביעי של פסח",
  S: "שבועות",
};

const r = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

// Table key: leap flag . RH weekday (Sunday = 1) . year type
// (0 incomplete / 1 regular / 2 complete), with a diaspora/israel
// digit appended when the year type alone is ambiguous.
// Negative value = doubled parsha (x and x+1), string = chag placeholder.
const TABLES = {
  "020": [51, 52, "v", ...r(0, 20), -21, 23, 24, "b", 25, -26, -28, 30, -31, ...r(33, 40), -41, ...r(43, 49), -50],
  "0220": [51, 52, "v", ...r(0, 20), -21, 23, 24, "b", 25, -26, -28, 30, -31, 33, "S", ...r(34, 37), -38, 40, -41, ...r(43, 49), -50],
  "0510": [52, "d", "v", ...r(0, 20), -21, 23, 24, "b", "b", 25, -26, -28, 30, -31, ...r(33, 40), -41, ...r(43, 50)],
  "0511": [52, "d", "v", ...r(0, 20), -21, 23, 24, "b", 25, -26, -28, ...r(30, 40), -41, ...r(43, 50)],
  "052": [52, "d", "g", ...r(0, 24), "L", 25, -26, -28, 30, -31, ...r(33, 40), -41, ...r(43, 50)],
  "070": ["m", 52, "w", "p", ...r(0, 20), -21, 23, 24, "L", 25, -26, -28, 30, -31, ...r(33, 40), -41, ...r(43, 50)],
  "072": ["m", 52, "w", "p", ...r(0, 20), -21, 23, 24, "A", 25, -26, -28, 30, -31, ...r(33, 40), -41, ...r(43, 49), -50],
  1200: [51, 52, "g", ...r(0, 27), "A", ...r(28, 33), "S", ...r(34, 37), -38, 40, -41, ...r(43, 49), -50],
  1201: [51, 52, "g", ...r(0, 27), "A", ...r(28, 40), -41, ...r(43, 49), -50],
  1220: [51, 52, "g", ...r(0, 27), "b", "b", ...r(28, 40), -41, ...r(43, 50)],
  1221: [51, 52, "g", ...r(0, 27), "b", ...r(28, 50)],
  150: [52, "d", "g", ...r(0, 28), "L", ...r(29, 50)],
  152: [52, "d", "g", ...r(0, 28), "A", ...r(29, 49), -50],
  170: ["m", 52, "w", "p", ...r(0, 27), "A", ...r(28, 40), -41, ...r(43, 49), -50],
  1720: ["m", 52, "w", "p", ...r(0, 27), "A", ...r(28, 33), "S", ...r(34, 37), -38, 40, -41, ...r(43, 49), -50],
};
TABLES["0221"] = TABLES["020"];
TABLES["0310"] = TABLES["0220"];
TABLES["0311"] = TABLES["020"];
TABLES["1310"] = TABLES["1220"];
TABLES["1311"] = TABLES["1221"];
TABLES["1721"] = TABLES["170"];

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

// Math.round absorbs DST hour shifts
function diffDays(a, b) {
  return Math.round((a - b) / 86400000);
}

// dow: 0 = Sunday ... 6 = Saturday
function dayOnOrBefore(dow, date) {
  return addDays(date, -((date.getDay() - dow + 7) % 7));
}

function isLeap(y) {
  return (7 * y + 1) % 19 < 7;
}

function tishrei1(hYear) {
  return H2G(hYear, 1, 1);
}

function yearTable(hYear) {
  const rh = tishrei1(hYear);
  const leap = isLeap(hYear) ? 1 : 0;
  const rhDay = rh.getDay() + 1;
  const len = diffDays(tishrei1(hYear + 1), rh);
  const type = len % 10 === 3 ? 0 : len % 10 === 5 ? 2 : 1;

  const key = `${leap}${rhDay}${type}`;
  return TABLES[key] || TABLES[key + "0"] || [];
}

function lookup(hYear, saturday) {
  const firstSaturday = dayOnOrBefore(6, addDays(tishrei1(hYear), 6));
  const week = Math.floor(diffDays(saturday, firstSaturday) / 7);

  const table = yearTable(hYear);
  if (week >= table.length) {
    return lookup(hYear + 1, saturday);
  }

  const val = table[week];
  if (typeof val === "string") {
    return CHAGIM[val];
  }
  if (val >= 0) {
    return PARSHIOT[val];
  }

  return PARSHIOT[-val] + "־" + PARSHIOT[-val + 1];
}

/**
 * Parsha (or yom tov) read on the Shabbos of the week containing the given
 * date ("YYYY-MM-DD" string or Date).
 */
export function parsha(date) {
  const d =
    date instanceof Date
      ? new Date(date.getFullYear(), date.getMonth(), date.getDate())
      : (() => {
          const [y, m, day] = String(date).slice(0, 10).split("-").map(Number);
          return new Date(y, m - 1, day);
        })();

  const saturday = dayOnOrBefore(6, addDays(d, 6));
  const hYear = Number(
    G2Hnumber(
      saturday.getFullYear(),
      saturday.getMonth() + 1,
      saturday.getDate()
    ).split("/")[2]
  );

  return lookup(hYear, saturday);
}
