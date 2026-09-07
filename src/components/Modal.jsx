import { useTranslation } from "react-i18next";
import { X } from "lucide-react";

export default function Modal({ title, onClose, children, width }) {
  const { t } = useTranslation();
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className="modal-card"
        style={width ? { maxWidth: width } : undefined}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label={t("common.close")}>
            <X className="icon-sm" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
