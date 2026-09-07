import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";

function toDateOnly(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isBlocked(date, indisponibilites) {
  return indisponibilites.some((periode) => {
    const debut = toDateOnly(new Date(periode.date_debut));
    const fin = toDateOnly(new Date(periode.date_fin));
    return date >= debut && date <= fin;
  });
}

export default function AvailabilityCalendar({ indisponibilites = [], focusDate }) {
  const { t, i18n } = useTranslation();
  const MONTH_NAMES = t("calendar.months", { returnObjects: true });
  const DOW = t("calendar.daysShort", { returnObjects: true });
  const PrevIcon = i18n.dir() === "rtl" ? ChevronRight : ChevronLeft;
  const NextIcon = i18n.dir() === "rtl" ? ChevronLeft : ChevronRight;

  const today = toDateOnly(new Date());
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  useEffect(() => {
    if (!focusDate) return;
    const d = new Date(focusDate);
    if (Number.isNaN(d.getTime())) return;
    setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
  }, [focusDate]);

  const days = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstDay = new Date(year, month, 1);
    // Lundi = 0 ... Dimanche = 6
    const leadingBlanks = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < leadingBlanks; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    return cells;
  }, [cursor]);

  function changeMonth(delta) {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  }

  const canGoBack = cursor.getFullYear() > today.getFullYear() || cursor.getMonth() > today.getMonth();

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button type="button" className="calendar-nav" onClick={() => changeMonth(-1)} disabled={!canGoBack}>
          <PrevIcon className="icon-sm" />
        </button>
        <span>
          {MONTH_NAMES[cursor.getMonth()]} {cursor.getFullYear()}
        </span>
        <button type="button" className="calendar-nav" onClick={() => changeMonth(1)}>
          <NextIcon className="icon-sm" />
        </button>
      </div>

      <div className="calendar-grid">
        {DOW.map((d, i) => (
          <div className="calendar-dow" key={i}>
            {d}
          </div>
        ))}
        {days.map((date, i) => {
          if (!date) return <div key={i} className="calendar-day empty" />;
          const past = date < today;
          const blocked = !past && isBlocked(date, indisponibilites);
          const cls = past ? "past" : blocked ? "blocked" : "available";
          return (
            <div key={i} className={"calendar-day " + cls}>
              {date.getDate()}
            </div>
          );
        })}
      </div>

      <div className="calendar-legend">
        <span>
          <span className="legend-dot available" /> {t("calendar.available")}
        </span>
        <span>
          <span className="legend-dot blocked" /> {t("calendar.blocked")}
        </span>
      </div>
    </div>
  );
}
