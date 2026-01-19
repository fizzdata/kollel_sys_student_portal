export function sec_to_time(totalSeconds, am = true) {
  if (totalSeconds > 0) {
    let Bighours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    let minutes = Math.floor(totalSeconds / 60);
    let seconds = totalSeconds % 60;
    let am_pm = Bighours < 12 ? "AM" : "PM";
    let hours = Bighours % 12 || 12;

    // If you want strings with leading zeroes:
    minutes = String(minutes).padStart(2, "0");
    Bighours = String(Bighours).padStart(2, "0");
    seconds = String(seconds).padStart(2, "0");

    if (am === true) {
      return hours + ":" + minutes + ":" + seconds + " " + am_pm;
    } else {
      return Bighours + ":" + minutes + ":" + seconds;
    }
  } else {
    return "-";
  }
}

// Helper function to convert Gregorian date to Hebrew date
function gregorianToHebrew(gregorianDate) {
  const date = new Date(gregorianDate);
  const months = [
    "Tishrei",
    "Cheshvan",
    "Kislev",
    "Tevet",
    "Shvat",
    "Adar",
    "Adar II",
    "Nisan",
    "Iyar",
    "Sivan",
    "Tamuz",
    "Av",
    "Elul",
  ];

  // Simplified conversion for demonstration purposes
  const hebrewYear = date.getFullYear() + 3760; // Rough calculation, not accurate for all dates
  const hebrewMonth = months[(date.getMonth() + 6) % 12];
  const hebrewDay = date.getDate();

  return { year: hebrewYear, month: hebrewMonth, day: hebrewDay };
}

// Function to determine the Parasha for a given Hebrew date
export function getHebrewParasha(gregorianDate) {
  const hebrewDate = gregorianToHebrew(gregorianDate);
  const parashaSchedule = {
    Tishrei: [
      "Beresheet",
      "Noach",
      "Lech-Lecha",
      "Vayera",
      "Chayei Sarah",
      "Toldot",
    ],
    Cheshvan: ["Vayetze", "Vayishlach", "Vayeshev", "Miketz"],
    Kislev: ["Vayigash", "Vayechi", "Shemot", "Vaera"],
    Tevet: ["Bo", "Beshalach", "Yitro", "Mishpatim"],
    Shvat: ["Terumah", "Tetzaveh", "Ki Tisa", "Vayakhel"],
    Adar: ["Pekudei", "Vayikra", "Tzav"],
    Nisan: ["Shmini", "Tazria", "Metzora", "Achrei Mot"],
    Iyar: ["Kedoshim", "Emor", "Behar", "Bechukotai"],
    Sivan: ["Bamidbar", "Naso", "Behaalotecha", "Shlach"],
    Tamuz: ["Korach", "Chukat", "Balak", "Pinchas"],
    Av: ["Matot", "Masei", "Devarim", "Vaetchanan"],
    Elul: ["Eikev", "Reeh", "Shoftim", "Ki Teitzei"],
  };

  const parashaList = parashaSchedule[hebrewDate.month];
  const weekOfMonth = Math.floor((hebrewDate.day - 1) / 7);

  return parashaList[weekOfMonth];
}

export const secondsToAmPm = (seconds) => {
  if (seconds == null) return "-";

  let hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")} ${ampm}`;
};

export const secondsToPercent = (workedSeconds, scheduledSeconds) => {
  if (!workedSeconds || !scheduledSeconds) return "-";

  const percent = (workedSeconds / scheduledSeconds) * 100;
  return `${Math.round(percent)}%`;
};

export const convertTo24Hour = (time12h) => {
  if (!time12h) return "";
  const [time, modifier] = time12h.split(" ");
  let [hours, minutes, seconds] = time.split(":").map(Number);

  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;

  return `${hours?.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};
