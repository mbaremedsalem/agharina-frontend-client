import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LayoutGrid, Map as MapIcon, Search } from "lucide-react";
import { useResource, usePaginatedResource } from "../api/useResource";
import FilterPanel from "../components/FilterPanel";
import BienCard from "../components/BienCard";
import BienMap from "../components/BienMap";
import Pagination from "../components/Pagination";
import SearchToggle from "../components/SearchToggle";

const FILTER_KEYS = [
  "type_bien",
  "type_transaction",
  "ville",
  "quartier",
  "prix_min",
  "prix_max",
  "nb_chambres",
  "meuble",
  "disponible_du",
  "disponible_au",
  "search",
];

export default function BiensListPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get("view") || "liste";
  const page = Number(searchParams.get("page") || "1");

  const filters = useMemo(() => {
    const f = {};
    FILTER_KEYS.forEach((k) => {
      const v = searchParams.get(k);
      if (v) f[k] = v;
    });
    return f;
  }, [searchParams]);

  function updateFilters(next) {
    const params = new URLSearchParams();
    FILTER_KEYS.forEach((k) => {
      if (next[k]) params.set(k, next[k]);
    });
    if (view !== "liste") params.set("view", view);
    setSearchParams(params);
  }

  function resetFilters() {
    const params = new URLSearchParams();
    if (view !== "liste") params.set("view", view);
    setSearchParams(params);
  }

  function setView(v) {
    const params = new URLSearchParams(searchParams);
    params.set("view", v);
    params.delete("page");
    setSearchParams(params);
  }

  function setPage(p) {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(p));
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function setSearchText(text) {
    const params = new URLSearchParams(searchParams);
    if (text) params.set("search", text);
    else params.delete("search");
    params.delete("page");
    setSearchParams(params);
  }

  const listQuery = { ...filters, page, ordering: "-date_creation", actif: "true" };
  const { results, count, loading, error } = usePaginatedResource("/biens/", listQuery);

  // En mode carte on veut voir tous les biens correspondants, pas seulement la page courante.
  const { items: allMatching, loading: mapLoading } = useResource(
    view === "carte" ? "/biens/" : null,
    { ...filters, actif: "true" }
  );

  return (
    <div className="container section">
      <div className="results-toolbar">
        <SearchToggle
          defaultValue={filters.search || ""}
          onCommit={setSearchText}
          placeholder={t("biensList.searchPlaceholder")}
        />
        <div className="view-toggle">
          <button
            type="button"
            className={"btn btn-toggle btn-small" + (view === "liste" ? " active" : "")}
            onClick={() => setView("liste")}
          >
            <LayoutGrid className="icon-sm" />
            {t("biensList.listView")}
          </button>
          <button
            type="button"
            className={"btn btn-toggle btn-small" + (view === "carte" ? " active" : "")}
            onClick={() => setView("carte")}
          >
            <MapIcon className="icon-sm" />
            {t("biensList.mapView")}
          </button>
        </div>
      </div>

      <div className="listing-layout">
        <FilterPanel filters={filters} onChange={updateFilters} onReset={resetFilters} />

        <div>
          <div className="results-count">
            {loading ? t("biensList.searching") : t("biensList.resultsCount", { count })}
          </div>

          {error && <div className="alert">{error}</div>}

          {view === "liste" ? (
            <>
              {!loading && results.length === 0 ? (
                <div className="empty-state" style={{ marginTop: "1rem" }}>
                  <Search className="icon" />
                  {t("biensList.noResults")}
                </div>
              ) : (
                <div className="bien-grid" style={{ marginTop: "1rem" }}>
                  {results.map((bien) => (
                    <BienCard key={bien.reference} bien={bien} />
                  ))}
                </div>
              )}
              <Pagination count={count} page={page} onChange={setPage} />
            </>
          ) : (
            <div style={{ marginTop: "1rem" }}>
              {mapLoading ? (
                <div className="page-loading">{t("biensList.loadingMap")}</div>
              ) : (
                <BienMap biens={allMatching} height={640} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
