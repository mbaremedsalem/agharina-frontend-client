import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, MapPin, SlidersHorizontal, Waypoints } from "lucide-react";
import { useResource } from "../api/useResource";
import { bienTypeOptions, transactionTypeOptions, localizedField } from "../constants";

const CHAMBRES_OPTIONS = ["1", "2", "3", "4", "5+"];

export default function FilterPanel({ filters, onChange, onReset }) {
  const { t, i18n } = useTranslation();
  const { items: villes } = useResource("/villes/");
  const { items: quartiers } = useResource("/quartiers/", filters.ville ? { ville: filters.ville } : undefined);

  const quartierOptions = useMemo(
    () => quartiers.filter((q) => String(q.ville) === String(filters.ville)),
    [quartiers, filters.ville]
  );

  function set(key, value) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <aside className="filter-panel">
      <h3>
        <SlidersHorizontal className="icon-sm" />
        {t("filters.title")}
      </h3>

      <div className="filter-group">
        <span>{t("filters.bienType")}</span>
        <div className="field-select-wrap">
          <select value={filters.type_bien || ""} onChange={(e) => set("type_bien", e.target.value)}>
            {bienTypeOptions(t).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown className="icon-sm chevron" />
        </div>
      </div>

      <div className="filter-group">
        <span>{t("filters.transaction")}</span>
        <div className="field-select-wrap">
          <select value={filters.type_transaction || ""} onChange={(e) => set("type_transaction", e.target.value)}>
            {transactionTypeOptions(t).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown className="icon-sm chevron" />
        </div>
      </div>

      <div className="filter-group">
        <span>{t("filters.city")}</span>
        <div className="field-select-wrap field-icon-wrap">
          <MapPin className="icon-sm" />
          <select
            value={filters.ville || ""}
            onChange={(e) => onChange({ ...filters, ville: e.target.value, quartier: "" })}
          >
            <option value="">{t("filters.allCities")}</option>
            {villes.map((v) => (
              <option key={v.id} value={v.id}>
                {localizedField(v, "nom", i18n)}
              </option>
            ))}
          </select>
          <ChevronDown className="icon-sm chevron" />
        </div>
      </div>

      {filters.ville && quartierOptions.length > 0 && (
        <div className="filter-group">
          <span>{t("filters.district")}</span>
          <div className="field-select-wrap field-icon-wrap">
            <Waypoints className="icon-sm" />
            <select value={filters.quartier || ""} onChange={(e) => set("quartier", e.target.value)}>
              <option value="">{t("filters.allDistricts")}</option>
              {quartierOptions.map((q) => (
                <option key={q.id} value={q.id}>
                  {localizedField(q, "nom", i18n)}
                </option>
              ))}
            </select>
            <ChevronDown className="icon-sm chevron" />
          </div>
        </div>
      )}

      <div className="filter-group">
        <span>{t("filters.budget")}</span>
        <div className="filter-row">
          <input
            type="number"
            placeholder={t("filters.min")}
            value={filters.prix_min || ""}
            onChange={(e) => set("prix_min", e.target.value)}
          />
          <input
            type="number"
            placeholder={t("filters.max")}
            value={filters.prix_max || ""}
            onChange={(e) => set("prix_max", e.target.value)}
          />
        </div>
      </div>

      <div className="filter-group">
        <span>{t("filters.rooms")}</span>
        <div className="chip-group">
          {CHAMBRES_OPTIONS.map((n) => {
            const value = n.replace("+", "");
            const active = String(filters.nb_chambres || "") === value;
            return (
              <span
                key={n}
                className={"chip" + (active ? " active" : "")}
                onClick={() => set("nb_chambres", active ? "" : value)}
              >
                {n}
              </span>
            );
          })}
        </div>
      </div>

      <div className="filter-group">
        <span>{t("filters.availability")}</span>
        <div className="filter-row">
          <input
            type="date"
            value={filters.disponible_du || ""}
            onChange={(e) => set("disponible_du", e.target.value)}
          />
          <input
            type="date"
            value={filters.disponible_au || ""}
            onChange={(e) => set("disponible_au", e.target.value)}
          />
        </div>
      </div>

      <label className="filter-group" style={{ flexDirection: "row", alignItems: "center", gap: "0.5rem" }}>
        <input
          type="checkbox"
          checked={Boolean(filters.meuble)}
          onChange={(e) => set("meuble", e.target.checked ? "true" : "")}
          style={{ width: 16, height: 16 }}
        />
        <span>{t("filters.furnishedOnly")}</span>
      </label>

      <button type="button" className="btn btn-ghost btn-small" onClick={onReset}>
        {t("filters.reset")}
      </button>
    </aside>
  );
}
