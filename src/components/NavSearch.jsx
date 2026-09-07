import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronDown, MapPin, Search, Tag } from "lucide-react";
import { useResource } from "../api/useResource";
import { bienTypeOptions, localizedField } from "../constants";

/** Icone loupe dans la navbar : au clic, ouvre un panneau de recherche multi-criteres. */
export default function NavSearch() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { items: villes } = useResource("/villes/");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  const [type_transaction, setTypeTransaction] = useState("");
  const [type_bien, setTypeBien] = useState("");
  const [ville, setVille] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    function onEscape(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  function handleSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (type_transaction) params.set("type_transaction", type_transaction);
    if (type_bien) params.set("type_bien", type_bien);
    if (ville) params.set("ville", ville);
    if (search) params.set("search", search);
    setOpen(false);
    navigate(`/biens?${params.toString()}`);
  }

  return (
    <div className="nav-search" ref={wrapRef}>
      <button
        type="button"
        className="btn btn-ghost search-toggle-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("nav.search")}
      >
        <Search className="icon-sm" />
      </button>

      {open && (
        <form className="nav-search-panel" onSubmit={handleSearch}>
          <div className="search-field">
            <span>{t("home.searchFor")}</span>
            <div className="field-select-wrap">
              <select value={type_transaction} onChange={(e) => setTypeTransaction(e.target.value)}>
                <option value="">{t("transactionTypes.any")}</option>
                <option value="vente">{t("nav.buy")}</option>
                <option value="location">{t("nav.rent")}</option>
              </select>
              <ChevronDown className="icon-sm chevron" />
            </div>
          </div>

          <div className="search-field">
            <span>{t("home.bienType")}</span>
            <div className="field-select-wrap">
              <select value={type_bien} onChange={(e) => setTypeBien(e.target.value)}>
                {bienTypeOptions(t).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="icon-sm chevron" />
            </div>
          </div>

          <div className="search-field">
            <span>{t("home.city")}</span>
            <div className="field-select-wrap field-icon-wrap">
              <MapPin className="icon-sm" />
              <select value={ville} onChange={(e) => setVille(e.target.value)}>
                <option value="">{t("home.allCities")}</option>
                {villes.map((v) => (
                  <option key={v.id} value={v.id}>
                    {localizedField(v, "nom", i18n)}
                  </option>
                ))}
              </select>
              <ChevronDown className="icon-sm chevron" />
            </div>
          </div>

          <div className="search-field">
            <span>{t("home.keywords")}</span>
            <div className="field-icon-wrap">
              <Tag className="icon-sm" />
              <input
                ref={inputRef}
                placeholder={t("home.keywordsPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block">
            <Search className="icon-sm" />
            {t("home.search")}
          </button>
        </form>
      )}
    </div>
  );
}
