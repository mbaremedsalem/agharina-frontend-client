import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, X } from "lucide-react";

/** Bouton loupe qui se transforme en champ de recherche au clic, et inversement. */
export default function SearchToggle({ defaultValue, onCommit, placeholder }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(Boolean(defaultValue));
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function close() {
    setOpen(false);
    onCommit("");
  }

  if (!open) {
    return (
      <button
        type="button"
        className="btn btn-ghost search-toggle-btn"
        onClick={() => setOpen(true)}
        aria-label={placeholder || t("common.search")}
      >
        <Search className="icon-sm" />
      </button>
    );
  }

  return (
    <div className="search-box">
      <Search className="icon-sm" />
      <input
        ref={inputRef}
        defaultValue={defaultValue}
        placeholder={placeholder || t("common.search")}
        onKeyDown={(e) => {
          if (e.key === "Enter") onCommit(e.currentTarget.value);
          if (e.key === "Escape") close();
        }}
        onBlur={(e) => onCommit(e.currentTarget.value)}
      />
      <button type="button" className="search-box-close" onClick={close} aria-label={t("common.close")}>
        <X className="icon-sm" />
      </button>
    </div>
  );
}
