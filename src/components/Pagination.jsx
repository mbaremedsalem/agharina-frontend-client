import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 20;

export default function Pagination({ count, page, onChange }) {
  const { t, i18n } = useTranslation();
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  if (totalPages <= 1) return null;

  const PrevIcon = i18n.dir() === "rtl" ? ChevronRight : ChevronLeft;
  const NextIcon = i18n.dir() === "rtl" ? ChevronLeft : ChevronRight;

  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  for (let p = start; p <= end; p++) pages.push(p);

  return (
    <div className="pagination">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        aria-label={t("biensList.prevPage")}
      >
        <PrevIcon className="icon-sm" />
      </button>
      {pages.map((p) => (
        <button key={p} type="button" className={p === page ? "active" : ""} onClick={() => onChange(p)}>
          {p}
        </button>
      ))}
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        aria-label={t("biensList.nextPage")}
      >
        <NextIcon className="icon-sm" />
      </button>
    </div>
  );
}
