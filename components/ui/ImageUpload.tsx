"use client";

import {
  useState,
  useRef,
  useEffect,
  type ChangeEvent,
  type DragEvent,
  type MouseEvent,
} from "react";
import { ImagePlus, Trash2 } from "lucide-react";

export type ImageUploadProps = {
  value?: string;
  fileName?: string;
  onChange: (url?: string, fileName?: string) => void;
  onError?: (error: string) => void;
  maxSizeBytes?: number;
  accept?: string;
  label?: string;
  placeholder?: string;
  helperText?: string;
  disabled?: boolean;
  className?: string;
};

const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

export function ImageUpload({
  value,
  fileName,
  onChange,
  onError,
  maxSizeBytes = DEFAULT_MAX_SIZE,
  accept = "image/png,image/jpeg,image/jpg,image/webp",
  label = "Ảnh bìa",
  placeholder = "Kéo thả hoặc chọn ảnh bìa",
  helperText = "PNG/JPG, tối đa 5MB",
  disabled = false,
  className = "",
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  function handleProcessFile(file: File) {
    if (!ACCEPTED_TYPES.includes(file.type.toLowerCase())) {
      onError?.("Chỉ chấp nhận file ảnh PNG, JPG hoặc WEBP.");
      return;
    }

    if (file.size > maxSizeBytes) {
      onError?.("Kích thước ảnh không được vượt quá 5MB.");
      return;
    }

    onError?.("");
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }
    const nextUrl = URL.createObjectURL(file);
    objectUrlRef.current = nextUrl;
    onChange(nextUrl, file.name);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    handleProcessFile(files[0]);
    // Reset file input so selecting the same file triggers change
    event.target.value = "";
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (disabled) return;
    setIsDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const files = event.dataTransfer.files;
    if (!files || files.length === 0) return;
    handleProcessFile(files[0]);
  }

  function handleRemove(event: MouseEvent) {
    event.stopPropagation();
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onError?.("");
    onChange(undefined, undefined);
  }

  return (
    <div className={`image-upload-wrapper ${className}`.trim()}>
      {label && <span className="image-upload-label">{label}</span>}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={handleFileChange}
        disabled={disabled}
      />

      {value ? (
        <div className="image-upload-preview-box">
          <div className="image-upload-thumbnail">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt={fileName || "Ảnh xem trước"} />
          </div>
          <div className="image-upload-preview-info">
            <span className="image-upload-filename">{fileName || "Ảnh bìa"}</span>
            <small className="image-upload-hint">Bản xem trước tạm thời</small>
          </div>
          {!disabled && (
            <button
              type="button"
              className="image-upload-remove-button"
              aria-label="Xóa ảnh"
              onClick={handleRemove}
            >
              <Trash2 size={16} />
              <span>Xóa ảnh</span>
            </button>
          )}
        </div>
      ) : (
        <div
          className={`image-upload-dropzone ${isDragging ? "dragging" : ""} ${disabled ? "disabled" : ""}`}
          onClick={() => !disabled && fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          role="button"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
        >
          <div className="image-upload-dropzone-content">
            <div className="image-upload-icon">
              <ImagePlus size={26} />
            </div>
            <p className="image-upload-placeholder">{placeholder}</p>
            <span className="image-upload-helper">{helperText}</span>
          </div>
        </div>
      )}
    </div>
  );
}
