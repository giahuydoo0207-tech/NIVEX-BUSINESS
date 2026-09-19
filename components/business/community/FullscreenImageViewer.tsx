"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface FullscreenImageViewerProps {
  images: string[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export function FullscreenImageViewer({
  images,
  initialIndex,
  isOpen,
  onClose,
}: FullscreenImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen || images.length === 0) return null;

  return (
    <div
      className="fullscreen-viewer-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="fullscreen-viewer-header" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="fullscreen-close-btn"
          onClick={onClose}
          aria-label="Đóng"
        >
          <X size={22} />
        </button>
        <span className="fullscreen-counter">
          {currentIndex + 1} / {images.length}
        </span>
        <div style={{ width: 40 }} />
      </div>

      <div
        className="fullscreen-image-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[currentIndex]}
          alt={`Hình ảnh ${currentIndex + 1}`}
          className="fullscreen-active-image"
        />

        {images.length > 1 && (
          <>
            <button
              type="button"
              className="fullscreen-nav-btn prev"
              onClick={handlePrev}
              aria-label="Ảnh trước"
            >
              <ChevronLeft size={28} />
            </button>
            <button
              type="button"
              className="fullscreen-nav-btn next"
              onClick={handleNext}
              aria-label="Ảnh sau"
            >
              <ChevronRight size={28} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
