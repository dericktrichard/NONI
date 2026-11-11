"use client";

import { useRef, useState } from "react";
import { OPEN_SIGN_IN } from "@/lib/auth/events";

const TARGET = { avatar: [512, 512], banner: [1920, 720] } as const;
const MAX_INPUT = 20 * 1024 * 1024;

/** Centre-crops to the target shape and re-encodes as a small JPEG before anything is sent */
async function crop(file: File, width: number, height: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.max(width / bitmap.width, height / bitmap.height);
    const w = width / scale;
    const h = height / scale;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("canvas unavailable");
    context.drawImage(
      bitmap,
      (bitmap.width - w) / 2,
      (bitmap.height - h) / 2,
      w,
      h,
      0,
      0,
      width,
      height,
    );
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("encode failed"))),
        "image/jpeg",
        0.86,
      ),
    );
  } finally {
    bitmap.close();
  }
}

interface ImageUploadProps {
  kind: "avatar" | "banner";
  onUploaded: (url: string) => void;
}

export function ImageUpload({ kind, onUploaded }: ImageUploadProps) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function choose(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setError("Use a JPEG, PNG or WebP image.");
      return;
    }
    if (file.size > MAX_INPUT) {
      setError("That image is too large.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const [width, height] = TARGET[kind];
      const blob = await crop(file, width, height);
      const form = new FormData();
      form.set("kind", kind);
      form.set("file", new File([blob], "image.jpg", { type: "image/jpeg" }));

      const response = await fetch("/api/profile/image", { method: "POST", body: form });
      if (response.status === 401) {
        window.dispatchEvent(new Event(OPEN_SIGN_IN));
        setError("Sign in to upload.");
        return;
      }
      const data = (await response.json().catch(() => null)) as {
        url?: string;
        error?: string;
      } | null;
      if (response.ok && data?.url) {
        onUploaded(data.url);
        return;
      }
      setError(data?.error ?? "Could not upload that image.");
    } catch {
      setError("Could not read that image.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => void choose(event)}
      />
      <button
        type="button"
        className="btn btn-line btn-sm"
        disabled={busy}
        onClick={() => input.current?.click()}
      >
        {busy ? "Uploading..." : "Upload your own"}
      </button>
      <p className="text-muted-foreground mt-2 text-xs">
        JPEG, PNG or WebP. Cropped to {kind === "avatar" ? "a square" : "a wide banner"}{" "}
        and saved right away.
      </p>
      {error ? (
        <p role="alert" className="mt-2 text-sm font-medium">
          {error}
        </p>
      ) : null}
    </div>
  );
}
