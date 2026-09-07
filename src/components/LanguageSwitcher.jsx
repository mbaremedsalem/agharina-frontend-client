import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";

export default function LanguageSwitcher({ className }) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  function toggle() {
    i18n.changeLanguage(isAr ? "fr" : "ar");
  }

  return (
    <button
      type="button"
      className={"btn btn-ghost btn-small" + (className ? " " + className : "")}
      onClick={toggle}
      title={isAr ? "Français" : "العربية"}
    >
      <Languages className="icon-sm" />
      {isAr ? "FR" : "AR"}
    </button>
  );
}
