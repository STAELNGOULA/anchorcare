/**
 * Re-encode image via canvas to drop EXIF/GPS metadata (client-side COPPA safety).
 */
export async function stripExifFromImageFile(file: File): Promise<Blob> {
  if (typeof document === "undefined") return file;

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("image_decode_failed"));
      el.src = objectUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas_unavailable");
    ctx.drawImage(img, 0, 0);

    const mime =
      file.type === "image/png"
        ? "image/png"
        : file.type === "image/webp"
          ? "image/webp"
          : "image/jpeg";

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) resolve(result);
          else reject(new Error("encode_failed"));
        },
        mime,
        mime === "image/jpeg" ? 0.92 : undefined,
      );
    });

    return blob;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
