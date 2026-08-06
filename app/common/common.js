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

// Parsha (or yom tov) of the week's Shabbos, in Hebrew — see parsha.js
export { parsha as getHebrewParasha } from "./parsha.js";

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
