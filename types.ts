/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export enum GenerationStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface GeneratedSvg {
  id: string;
  content: string;
  prompt: string;
  timestamp: number;
  spaceId?: string;
}

export interface SpaceKnowledge {
  type: 'file' | 'url';
  value: string;
  name?: string;
  mimeType?: string;
}

export interface Space {
  id: string;
  uid: string;
  title: string;
  description?: string;
  prompt?: string;
  knowledge: SpaceKnowledge[];
  timestamp: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  avatarConfig?: {
    style: string;
    seed: string;
  };
  isUnlimited?: boolean;
  geminiApiKey?: string;
}

export interface ApiError {
  message: string;
  details?: string;
}

// ── Visual Style Reference System ─────────────────────────────────────────────

/** Which selector category an active style belongs to */
export type StyleCategory = 'period' | 'movement' | 'designer' | 'illustrator' | 'artist';

/** The active style selection passed from InputSection → App → geminiService */
export interface StyleSelection {
  category: StyleCategory;
  name: string;
  /** URL-safe slug, e.g. "arthur-rackham", "impressionism" */
  slug: string;
}

/** Firestore doc shape stored under collection: style_refs */
export interface StyleRef {
  category: StyleCategory;
  name: string;
  slug: string;
  /** Firebase Storage download URLs — used for client-side image fetch */
  imageUrls: string[];
  /** GCS URIs (gs://bucket/...) — used by Vertex AI embedding pipeline */
  imageGcsUris: string[];
  imageCount: number;
  uploadedAt: number;
}

// ── SVG Output Aspect Ratio ────────────────────────────────────────────────────

export type AspectRatio = 'square' | 'wide' | 'portrait';

export const ASPECT_RATIO_CONFIG: Record<AspectRatio, { width: number; height: number; label: string; icon: string }> = {
  square:  { width: 600, height: 600, label: 'Square',    icon: '⬜' },
  wide:    { width: 800, height: 450, label: 'Wide',      icon: '▬'  },
  portrait:{ width: 450, height: 800, label: 'Portrait',  icon: '▯'  },
};

