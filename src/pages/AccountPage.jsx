import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  Check,
  Copy,
  Gift,
  Mail,
  Phone,
  Receipt,
  Save,
  ShoppingBag,
  Star,
  User,
  UserCircle,
  Users,
} from "lucide-react";
import { api } from "../api/client";
import { useResource } from "../api/useResource";
import { useAuth } from "../context/AuthContext";
import { copyToClipboard } from "../utils/clipboard";
import { formatPrix, localizedField, transactionTypeLabel } from "../constants";

function daysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

export default function AccountPage() {
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState("profil");
  const { items: transactions, loading: txLoading } = useResource("/transactions/");

  const TABS = [
    { key: "profil", label: t("account.tabProfile"), icon: UserCircle },
    { key: "points", label: t("account.tabPoints"), icon: Star },
    { key: "reservations", label: t("account.tabReservations"), icon: Receipt },
    { key: "cadeaux", label: t("account.tabCadeaux"), icon: ShoppingBag },
    { key: "invitation", label: t("account.tabInvite"), icon: Gift },
  ];

  const endingSoon = transactions.filter(
    (tx) =>
      tx.statut === "confirmee" &&
      tx.type_transaction === "location" &&
      tx.date_fin &&
      daysUntil(tx.date_fin) >= 0 &&
      daysUntil(tx.date_fin) <= 4
  );

  return (
    <div className="container section">
      <div className="section-header">
        <h2>{t("account.title")}</h2>
      </div>

      {!txLoading && endingSoon.length > 0 && (
        <div className="alert reservation-notice">
          <AlertTriangle className="icon-sm" />
          <div>
            {endingSoon.map((tx) => {
              const days = daysUntil(tx.date_fin);
              const titre = localizedField({ titre: tx.bien_titre, titre_ar: tx.bien_titre_ar }, "titre", i18n);
              return (
                <div key={tx.id}>
                  <strong>{t("myTransactions.notificationTitle")}</strong>
                  {days === 0
                    ? t("myTransactions.notificationBodyToday", { titre })
                    : t("myTransactions.notificationBody", { count: days, titre })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="account-layout">
        <nav className="account-nav">
          {TABS.map((tabItem) => (
            <button
              key={tabItem.key}
              type="button"
              className={tab === tabItem.key ? "active" : ""}
              onClick={() => setTab(tabItem.key)}
            >
              <tabItem.icon className="icon-sm" />
              {tabItem.label}
            </button>
          ))}
        </nav>

        <div>
          {tab === "profil" && <ProfilTab />}
          {tab === "points" && <PointsTab />}
          {tab === "reservations" && <ReservationsTab transactions={transactions} loading={txLoading} />}
          {tab === "cadeaux" && <CadeauxTab />}
          {tab === "invitation" && <InvitationTab />}
        </div>
      </div>
    </div>
  );
}

function ProfilTab() {
  const { t } = useTranslation();
  const { user, setUser } = useAuth();
  const [values, setValues] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
    telephone: user?.telephone || "",
    est_gestionnaire: Boolean(user?.est_gestionnaire),
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  function set(key, value) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updated = await api.patch("/profil/", values);
      setUser(updated);
      setSaved(true);
    } catch (err) {
      setError(err.message || t("account.updateError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="detail-card">
      <h3>
        <User className="icon-sm" />
        {t("account.personalInfo")}
      </h3>
      <form onSubmit={handleSubmit} style={{ marginTop: "1rem" }}>
        {error && (
          <div className="alert" style={{ marginBottom: "1rem" }}>
            {error}
          </div>
        )}
        <div className="auth-field-row" style={{ marginBottom: "0.9rem" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>{t("account.firstName")}</span>
            <input value={values.first_name} onChange={(e) => set("first_name", e.target.value)} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>{t("account.lastName")}</span>
            <input value={values.last_name} onChange={(e) => set("last_name", e.target.value)} />
          </label>
        </div>

        <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem", marginBottom: "0.9rem" }}>
          <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>{t("account.email")}</span>
          <div className="field-icon-wrap">
            <Mail className="icon-sm" />
            <input type="email" value={values.email} onChange={(e) => set("email", e.target.value)} />
          </div>
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem", marginBottom: "1rem" }}>
          <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>{t("account.phone")}</span>
          <div className="field-icon-wrap">
            <Phone className="icon-sm" />
            <input value={values.telephone} onChange={(e) => set("telephone", e.target.value)} />
          </div>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
          <input
            type="checkbox"
            checked={values.est_gestionnaire}
            onChange={(e) => set("est_gestionnaire", e.target.checked)}
            style={{ width: 16, height: 16 }}
          />
          <span style={{ fontSize: "0.85rem" }}>{t("account.isManager")}</span>
        </label>

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saved ? <Check className="icon-sm" /> : <Save className="icon-sm" />}
          {saving ? t("common.saving") : saved ? t("common.saved") : t("common.save")}
        </button>
      </form>
    </div>
  );
}

function PointsTab() {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/mes-points/")
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading">{t("common.loading")}</div>;

  return (
    <div>
      <div className="points-hero">
        <div>
          <div className="points-hero-label">{t("account.pointsBalance")}</div>
          <div className="points-hero-value">{data?.solde_points ?? 0} pts</div>
        </div>
        <Star size={48} style={{ position: "relative", zIndex: 1, opacity: 0.5 }} />
      </div>

      <div className="detail-card">
        <h3>{t("account.history")}</h3>
        {data?.historique?.length ? (
          <div style={{ marginTop: "0.5rem" }}>
            {data.historique.map((mvt) => (
              <div className="points-history-row" key={mvt.id}>
                <div>
                  <div>
                    {mvt.description ||
                      (mvt.type_mouvement === "gagne" ? t("account.pointsEarned") : t("account.pointsConverted"))}
                  </div>
                  <div className="muted" style={{ fontSize: "0.78rem" }}>
                    {new Date(mvt.date_creation).toLocaleDateString(i18n.language)}
                  </div>
                </div>
                <span className={"points-delta " + (mvt.points >= 0 ? "positive" : "negative")}>
                  {mvt.points >= 0 ? "+" : ""}
                  {mvt.points}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted" style={{ marginTop: "0.5rem" }}>
            {t("account.noHistory")}
          </p>
        )}
      </div>
    </div>
  );
}

function ReservationsTab({ transactions, loading }) {
  const { t, i18n } = useTranslation();

  if (loading) return <div className="page-loading">{t("common.loading")}</div>;

  if (transactions.length === 0) {
    return (
      <div className="detail-card">
        <h3>
          <Receipt className="icon-sm" />
          {t("account.tabReservations")}
        </h3>
        <p className="muted" style={{ marginTop: "0.5rem" }}>
          {t("myTransactions.empty")}
        </p>
      </div>
    );
  }

  return (
    <div>
      {transactions.map((tx) => {
        const titre = localizedField({ titre: tx.bien_titre, titre_ar: tx.bien_titre_ar }, "titre", i18n);
        const isLocation = tx.type_transaction === "location";
        const days = isLocation && tx.date_fin ? daysUntil(tx.date_fin) : null;
        const showCountdown = isLocation && tx.statut === "confirmee" && days !== null && days >= 0;

        return (
          <div className="tx-card" key={tx.id}>
            <div className="tx-card-top">
              <div>
                <Link to={`/biens/${tx.bien_reference}`} className="tx-card-title">
                  {titre}
                </Link>
                <div className="tx-card-meta">
                  <span className="muted" style={{ fontFamily: "monospace" }}>
                    {tx.reference}
                  </span>
                  <span className="badge">{transactionTypeLabel(t, tx.type_transaction)}</span>
                  <span className={"badge statut-" + tx.statut}>
                    {t(`myTransactions.statut_${tx.statut}`)}
                  </span>
                </div>
              </div>
              <strong>{formatPrix(t, tx.montant_total, "forfait")}</strong>
            </div>

            {isLocation && (tx.date_debut || tx.date_fin) && (
              <div className="tx-card-dates">
                <span className="muted">
                  {tx.date_debut} → {tx.date_fin}
                </span>
                {showCountdown && (
                  <span className={"tx-days-left " + (days <= 4 ? "urgent" : "ok")}>
                    {days === 0
                      ? t("myTransactions.endingToday")
                      : t("myTransactions.daysRemaining", { count: days })}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CadeauxTab() {
  const { t, i18n } = useTranslation();
  const { refreshUser } = useAuth();
  const { items: cadeaux, loading: cadeauxLoading } = useResource("/cadeaux/");
  const { items: echanges, loading: echangesLoading, reload: reloadEchanges } = useResource("/echanges-cadeaux/");
  const [solde, setSolde] = useState(null);
  const [redeemingId, setRedeemingId] = useState(null);
  const [toast, setToast] = useState(null);

  function reloadSolde() {
    return api.get("/mes-points/").then((data) => setSolde(data.solde_points));
  }

  useEffect(() => {
    reloadSolde();
  }, []);

  function showToast(message, type = "error") {
    setToast({ message, type });
  }

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), toast.type === "success" ? 8000 : 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  async function handleRedeem(cadeau) {
    if (solde < cadeau.points_necessaires) {
      showToast(t("cadeaux.insufficientPoints"), "error");
      return;
    }
    if (!window.confirm(t("cadeaux.confirmRedeem", { points: cadeau.points_necessaires, nom: cadeau.nom }))) return;
    setRedeemingId(cadeau.id);
    try {
      const echange = await api.post("/echanges-cadeaux/", { cadeau: cadeau.id });
      showToast(t("cadeaux.redeemSuccessWithRef", { reference: echange.reference }), "success");
      await Promise.all([reloadSolde(), reloadEchanges(), refreshUser()]);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setRedeemingId(null);
    }
  }

  const loading = cadeauxLoading || echangesLoading || solde === null;
  if (loading) return <div className="page-loading">{t("common.loading")}</div>;

  return (
    <div>
      <div className="points-hero">
        <div>
          <div className="points-hero-label">{t("account.pointsBalance")}</div>
          <div className="points-hero-value">{solde} pts</div>
        </div>
        <Gift size={48} style={{ position: "relative", zIndex: 1, opacity: 0.5 }} />
      </div>

      {toast && (
        <div className="toast-stack">
          <div className={"toast " + (toast.type === "success" ? "toast-success" : "toast-error")}>
            {toast.message}
          </div>
        </div>
      )}

      <div className="detail-card">
        <h3>
          <ShoppingBag className="icon-sm" />
          {t("cadeaux.catalogTitle")}
        </h3>
        {cadeaux.length === 0 ? (
          <p className="muted" style={{ marginTop: "0.5rem" }}>
            {t("cadeaux.emptyCatalog")}
          </p>
        ) : (
          <div className="cadeaux-grid">
            {cadeaux.map((cadeau) => {
              const insufficient = solde < cadeau.points_necessaires;
              const outOfStock = cadeau.stock <= 0;
              const disabled = outOfStock || redeemingId === cadeau.id;
              return (
                <div className="cadeau-card" key={cadeau.id}>
                  {cadeau.image && <img src={cadeau.image} alt={cadeau.nom} className="cadeau-card-image" />}
                  <div className="cadeau-card-body">
                    <div className="cadeau-card-title">{cadeau.nom}</div>
                    {cadeau.description && <div className="cadeau-card-desc">{cadeau.description}</div>}
                    <div className="cadeau-card-footer">
                      <span className="cadeau-points-badge">
                        {t("cadeaux.pointsNeeded", { count: cadeau.points_necessaires })}
                      </span>
                      {!outOfStock && (
                        <span className="cadeau-stock-note">
                          {t("cadeaux.stockLabel", { count: cadeau.stock })}
                        </span>
                      )}
                    </div>
                    {insufficient && !outOfStock && (
                      <span className="cadeau-stock-note" style={{ color: "var(--danger-text)" }}>
                        {t("cadeaux.insufficientPoints")}
                      </span>
                    )}
                    <button
                      type="button"
                      className="btn btn-primary btn-small"
                      disabled={disabled}
                      onClick={() => handleRedeem(cadeau)}
                    >
                      <Gift className="icon-sm" />
                      {redeemingId === cadeau.id
                        ? t("cadeaux.redeeming")
                        : outOfStock
                        ? t("cadeaux.outOfStock")
                        : t("cadeaux.redeemButton")}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="detail-card" style={{ marginTop: "1.25rem" }}>
        <h3>{t("cadeaux.historyTitle")}</h3>
        {echanges.length ? (
          <div style={{ marginTop: "0.5rem" }}>
            {echanges.map((ech) => (
              <div className="points-history-row" key={ech.id}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  {ech.cadeau_image && (
                    <img
                      src={ech.cadeau_image}
                      alt=""
                      style={{ width: 36, height: 36, borderRadius: "var(--radius-sm)", objectFit: "cover" }}
                    />
                  )}
                  <div>
                    <div>{ech.cadeau_nom}</div>
                    <div className="muted" style={{ fontSize: "0.78rem", fontFamily: "monospace" }}>
                      {ech.reference}
                    </div>
                    <div className="muted" style={{ fontSize: "0.78rem" }}>
                      {new Date(ech.date_creation).toLocaleDateString(i18n.language)}
                    </div>
                  </div>
                </div>
                <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span className="points-delta negative">-{ech.points_utilises}</span>
                  <span className={"badge statut-" + ech.statut}>{t(`cadeaux.statut_${ech.statut}`)}</span>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted" style={{ marginTop: "0.5rem" }}>
            {t("cadeaux.emptyHistory")}
          </p>
        )}
      </div>
    </div>
  );
}

function InvitationTab() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const inviteLink = user ? `${window.location.origin}/invite/${user.code_invitation}` : "";

  function copyLink() {
    copyToClipboard(inviteLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="detail-card">
      <h3>
        <Users className="icon-sm" />
        {t("account.inviteTitle")}
      </h3>
      <p className="muted" style={{ marginTop: "0.5rem", lineHeight: 1.6 }}>
        {t("account.inviteSubtitle")}
      </p>

      <div style={{ marginTop: "1rem" }}>
        <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>{t("account.inviteLink")}</span>
        <div className="invite-box" style={{ marginTop: "0.4rem" }}>
          <span style={{ flex: 1 }}>{inviteLink}</span>
          <button type="button" className="btn btn-small btn-ghost" onClick={copyLink}>
            {copied ? <Check className="icon-sm" /> : <Copy className="icon-sm" />}
            {copied ? t("common.copied") : t("common.copy")}
          </button>
        </div>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>{t("account.referralCode")}</span>
        <div className="invite-box" style={{ marginTop: "0.4rem" }}>{user?.code_invitation}</div>
      </div>

      {typeof user?.nb_filleuls === "number" && (
        <p className="muted" style={{ marginTop: "1rem" }}>
          {t("account.referralsCount", { count: user.nb_filleuls })}
        </p>
      )}
    </div>
  );
}
