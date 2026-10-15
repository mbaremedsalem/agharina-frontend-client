import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Images, Play, X } from "lucide-react";
import { DEFAULT_BIEN_IMAGE } from "../constants";

export default function MediaGallery({ medias = [] }) {
  const { t, i18n } = useTranslation();
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const PrevIcon = i18n.dir() === "rtl" ? ChevronRight : ChevronLeft;
  const NextIcon = i18n.dir() === "rtl" ? ChevronLeft : ChevronRight;

  if (medias.length === 0) {
    return (
      <div className="gallery-empty">
        <img src={DEFAULT_BIEN_IMAGE} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    );
  }

  const main = medias[0];
  const side = medias.slice(1, 5);
  const extraCount = medias.length - 5;

  function openAt(index) {
    setLightboxIndex(index);
  }

  function closeLightbox() {
    setLightboxIndex(null);
  }

  function step(delta) {
    setLightboxIndex((i) => (i + delta + medias.length) % medias.length);
  }

  return (
    <>
      <div className={`gallery${medias.length === 1 ? " gallery-single" : ""}`}>
        <div className="gallery-main" onClick={() => openAt(0)}>
          {main.type_media === "video" ? (
            <video src={main.fichier} muted />
          ) : (
            <img src={main.fichier} alt={main.legende || ""} />
          )}
        </div>
        {side.length > 0 && (
          <div className="gallery-side">
            {side.map((media, i) => (
              <div key={media.id} className="gallery-side-item" onClick={() => openAt(i + 1)}>
                {media.type_media === "video" ? (
                  <>
                    <video src={media.fichier} muted />
                    <span
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(0,0,0,0.25)",
                      }}
                    >
                      <Play color="#fff" fill="#fff" size={22} />
                    </span>
                  </>
                ) : (
                  <img src={media.fichier} alt={media.legende || ""} />
                )}
                {i === side.length - 1 && extraCount > 0 && (
                  <div className="gallery-more-overlay">
                    <Images className="icon-sm" style={{ marginInlineEnd: 6 }} />+{extraCount}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {lightboxIndex !== null && (
        <div className="lightbox" onClick={closeLightbox}>
          <button className="lightbox-close" onClick={closeLightbox} aria-label={t("gallery.close")}>
            <X color="#fff" />
          </button>
          {medias.length > 1 && (
            <button
              className="lightbox-nav lightbox-prev"
              onClick={(e) => {
                e.stopPropagation();
                step(-1);
              }}
              aria-label={t("gallery.prev")}
            >
              <PrevIcon color="#fff" />
            </button>
          )}
          <div onClick={(e) => e.stopPropagation()}>
            {medias[lightboxIndex].type_media === "video" ? (
              <video src={medias[lightboxIndex].fichier} controls autoPlay />
            ) : (
              <img src={medias[lightboxIndex].fichier} alt={medias[lightboxIndex].legende || ""} />
            )}
          </div>
          {medias.length > 1 && (
            <button
              className="lightbox-nav lightbox-next"
              onClick={(e) => {
                e.stopPropagation();
                step(1);
              }}
              aria-label={t("gallery.next")}
            >
              <NextIcon color="#fff" />
            </button>
          )}
        </div>
      )}
    </>
  );
}
