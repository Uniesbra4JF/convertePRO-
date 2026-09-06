import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import JSZip from 'jszip';

// Configura o worker local do PDF.js sem depender de CDN externa
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const QUALITY_MAP = { high: 0.92, medium: 0.72, low: 0.5 };
const PAGE_SIZES = { a4: [595.28, 841.89], letter: [612, 792] };

/**
 * Comprime uma imagem via Canvas e retorna um ArrayBuffer JPEG.
 * @param {File|Blob} file
 * @param {number} quality  0–1
 * @returns {Promise<{bytes: Uint8Array, width: number, height: number}>}
 */
function compressImage(file, quality) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (!blob) return reject(new Error('Canvas toBlob falhou'));
          blob.arrayBuffer().then((ab) =>
            resolve({ bytes: new Uint8Array(ab), width: img.naturalWidth, height: img.naturalHeight })
          );
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Imagem inválida')); };
    img.src = url;
  });
}

/**
 * Converte uma lista de arquivos de imagem em um único PDF.
 * @param {File[]} files
 * @param {{ quality: string, filename: string, onProgress: (pct: number) => void }} opts
 * @returns {Promise<{blob: Blob, sizeBytes: number}>}
 */
export async function imagesToPdf(files, opts = {}) {
  const quality = QUALITY_MAP[opts.quality] ?? QUALITY_MAP.high;
  const onProgress = opts.onProgress || (() => {});

  const pdfDoc = await PDFDocument.create();
  const total = files.length;

  for (let i = 0; i < total; i++) {
    const { bytes, width, height } = await compressImage(files[i], quality);
    const jpgImage = await pdfDoc.embedJpg(bytes);

    // Cria página com o tamanho da imagem (original)
    const page = pdfDoc.addPage([width, height]);
    page.drawImage(jpgImage, { x: 0, y: 0, width, height });

    onProgress(Math.round(((i + 1) / total) * 100));
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });

  return { blob, sizeBytes: pdfBytes.byteLength };
}

/**
 * Converte um arquivo PDF em uma lista de imagens PNG de alta resolução.
 * @param {File|Blob} pdfFile
 * @param {{ scale?: number, onProgress?: (pct: number, current: number, total: number) => void }} opts
 * @returns {Promise<Array<{ pageNumber: number, blob: Blob, url: string, width: number, height: number, sizeBytes: number, filename: string }>>}
 */
export async function pdfToPng(pdfFile, opts = {}) {
  const scale = opts.scale || 2.0; // Renderização nítida em alta densidade
  const onProgress = opts.onProgress || (() => {});

  const arrayBuffer = await pdfFile.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;
  const pages = [];

  const baseName = (pdfFile.name || 'documento').replace(/\.[^/.]+$/, '');

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    await page.render({ canvasContext: ctx, viewport }).promise;

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error(`Falha ao converter página ${i} para PNG`));
      }, 'image/png');
    });

    const filename = `${baseName}_pagina_${i}.png`;
    const url = URL.createObjectURL(blob);

    pages.push({
      pageNumber: i,
      blob,
      url,
      width: viewport.width,
      height: viewport.height,
      sizeBytes: blob.size,
      filename,
    });

    onProgress(Math.round((i / totalPages) * 100), i, totalPages);
  }

  return pages;
}

/**
 * Empacota uma lista de imagens PNG em um arquivo .zip
 * @param {Array<{ blob: Blob, filename: string }>} pages
 * @param {string} zipBaseName
 * @returns {Promise<{ blob: Blob, sizeBytes: number, filename: string }>}
 */
export async function createZipFromImages(pages, zipBaseName = 'imagens_png') {
  const zip = new JSZip();
  const folder = zip.folder(zipBaseName) || zip;

  for (const p of pages) {
    folder.file(p.filename, p.blob);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const filename = `${zipBaseName}.zip`;

  return {
    blob: zipBlob,
    sizeBytes: zipBlob.size,
    filename,
  };
}

/**
 * Cria uma URL temporária para preview.
 */
export function createPdfUrl(blob) {
  return URL.createObjectURL(blob);
}

/**
 * Converte Blob para string Base64 (necessário para o Capacitor Filesystem).
 * @param {Blob} blob
 * @returns {Promise<string>}
 */
export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const dataUrl = reader.result;
      const base64 = dataUrl.split(',')[1];
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
}

