import jsPDF from "jspdf";

const MAX_WIDTH = 800;
const MAX_HEIGHT = 600;
const JPEG_QUALITY = 0.5;

/**
 * Loads an image URL and returns a compressed JPEG base64 string.
 * Downscales large images to MAX_WIDTH x MAX_HEIGHT.
 */
export const loadImageCompressed = (url: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      let w = img.width;
      let h = img.height;

      // Downscale if too large
      if (w > MAX_WIDTH || h > MAX_HEIGHT) {
        const ratio = Math.min(MAX_WIDTH / w, MAX_HEIGHT / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
    };
    img.onerror = () => resolve("");
    img.src = url;
  });
};

/**
 * Loads a logo/small image as compressed PNG (logos need transparency).
 * Caps at 200x200.
 */
export const loadLogoCompressed = (url: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      const maxDim = 200;
      if (w > maxDim || h > maxDim) {
        const ratio = Math.min(maxDim / w, maxDim / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve("");
    img.src = url;
  });
};

/**
 * Safely adds a compressed image to a jsPDF document.
 */
export const addImageSafe = async (
  doc: jsPDF,
  url: string,
  x: number,
  y: number,
  w: number,
  h: number
): Promise<boolean> => {
  if (!url || url === "admin_manual") return false;
  try {
    const data = await loadImageCompressed(url);
    if (data) {
      doc.addImage(data, "JPEG", x, y, w, h);
      return true;
    }
  } catch { /* ignore */ }
  return false;
};
