/**
 * styleRefService.ts
 * Manages hand-curated visual style reference images stored in Firebase Storage,
 * with metadata indexed in Firestore. Reference images are passed to Gemini as
 * style-context-only multimodal parts — never reproduced in output.
 */

import { db, storage } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, deleteField } from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
} from 'firebase/storage';
import { StyleSelection, StyleRef, StyleCategory } from '../types';
import { ReferenceFile } from './geminiService';

// ── Utilities ──────────────────────────────────────────────────────────────────

/** Convert a display name to a URL-safe slug */
export const toSlug = (name: string): string =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Firestore document ID for a given style selection */
const docId = (selection: StyleSelection) => `${selection.category}_${selection.slug}`;

/** Firebase Storage folder path for a given style selection */
const storagePath = (selection: StyleSelection) =>
  `style-refs/${selection.category}/${selection.slug}`;

// ── Read Operations ────────────────────────────────────────────────────────────

/**
 * Look up reference image URLs for a given style selection.
 * Returns an empty array if no references have been uploaded yet.
 * Fails gracefully — a missing doc is not an error.
 */
export const getStyleRefs = async (selection: StyleSelection): Promise<StyleRef | null> => {
  try {
    const snap = await getDoc(doc(db, 'style_refs', docId(selection)));
    if (!snap.exists()) return null;
    return snap.data() as StyleRef;
  } catch (err) {
    console.warn('[styleRefService] getStyleRefs failed (non-fatal):', err);
    return null;
  }
};

/**
 * Load a lightweight manifest: the set of Firestore document IDs that have
 * at least one reference image. Used to show Camera indicators in dropdowns.
 * Returns a Set of doc IDs like "illustrators_arthur-rackham".
 */
export const getStyleRefManifest = async (): Promise<Set<string>> => {
  try {
    // We query Storage listing rather than Firestore to avoid a full collection scan.
    // Each category folder is listed: style-refs/illustrators/, etc.
    const categories: StyleCategory[] = ['period', 'movement', 'designer', 'illustrator', 'artist'];
    const ids = new Set<string>();

    await Promise.all(
      categories.map(async (cat) => {
        const folderRef = ref(storage, `style-refs/${cat}`);
        try {
          const result = await listAll(folderRef);
          result.prefixes.forEach((prefix) => {
            // prefix.name is the slug
            ids.add(`${cat}_${prefix.name}`);
          });
        } catch {
          // Category folder may not exist yet — that's fine
        }
      })
    );

    return ids;
  } catch (err) {
    console.warn('[styleRefService] getStyleRefManifest failed (non-fatal):', err);
    return new Set();
  }
};

// ── Image Fetching for Gemini ──────────────────────────────────────────────────

/**
 * Fetch up to `maxImages` reference images as base64 ReferenceFile objects,
 * ready to be inserted as inlineData parts in a Gemini multimodal request.
 */
export const fetchStyleImagesForGemini = async (
  styleRef: StyleRef,
  maxImages = 3
): Promise<ReferenceFile[]> => {
  const urls = styleRef.imageUrls.slice(0, maxImages);
  const results: ReferenceFile[] = [];

  await Promise.all(
    urls.map(async (url) => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        const base64 = await blobToBase64(blob);
        results.push({
          type: 'image',
          mimeType: blob.type || 'image/jpeg',
          data: base64,
        });
      } catch (err) {
        console.warn(`[styleRefService] Failed to fetch style ref image (non-fatal): ${url}`, err);
      }
    })
  );

  return results;
};

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // Strip data:image/...;base64, prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

// ── Admin Write Operations ─────────────────────────────────────────────────────

/**
 * Upload a single image file to Firebase Storage under the style's folder,
 * then update the Firestore metadata document with the new URL.
 * Returns the public download URL of the uploaded image.
 */
export const uploadStyleRefImage = async (
  selection: StyleSelection,
  file: File,
  index: number
): Promise<{ downloadUrl: string; gcsUri: string }> => {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const filename = `${String(index).padStart(2, '0')}.${ext}`;
  const path = `${storagePath(selection)}/${filename}`;

  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, { contentType: file.type });
  const downloadUrl = await getDownloadURL(storageRef);

  // GCS URI for Vertex AI (Phase 2)
  const gcsUri = `gs://${storageRef.bucket}/${path}`;

  return { downloadUrl, gcsUri };
};

/**
 * Save (or update) the Firestore metadata document for a style's reference images.
 * Call this after uploading images with uploadStyleRefImage.
 */
export const saveStyleRefMetadata = async (
  selection: StyleSelection,
  imageUrls: string[],
  imageGcsUris: string[]
): Promise<void> => {
  const data: StyleRef = {
    category: selection.category,
    name: selection.name,
    slug: selection.slug,
    imageUrls,
    imageGcsUris,
    imageCount: imageUrls.length,
    uploadedAt: Date.now(),
  };
  await setDoc(doc(db, 'style_refs', docId(selection)), data);
};

/**
 * Delete a single reference image from Storage and remove it from
 * the Firestore metadata document.
 */
export const deleteStyleRefImage = async (
  selection: StyleSelection,
  imageUrl: string,
  currentRef: StyleRef
): Promise<void> => {
  // Delete from Storage — extract path from download URL
  try {
    const urlPath = decodeURIComponent(new URL(imageUrl).pathname.split('/o/')[1].split('?')[0]);
    await deleteObject(ref(storage, urlPath));
  } catch (err) {
    console.warn('[styleRefService] Storage delete failed (non-fatal):', err);
  }

  // Update Firestore
  const newUrls = currentRef.imageUrls.filter((u) => u !== imageUrl);
  const newGcsUris = currentRef.imageGcsUris.filter((_, i) => currentRef.imageUrls[i] !== imageUrl);

  if (newUrls.length === 0) {
    // No images left — remove the Firestore doc entirely
    await setDoc(doc(db, 'style_refs', docId(selection)), deleteField() as any);
  } else {
    await saveStyleRefMetadata(selection, newUrls, newGcsUris);
  }
};
