/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { AspectRatio, ASPECT_RATIO_CONFIG } from "../types";

export interface ReferenceFile {
  type: 'image' | 'text' | 'pdf';
  mimeType: string;
  data: string; // base64 for image/pdf, raw string for text
}

// ── Style Reference Preamble ───────────────────────────────────────────────────
// Injected before any reference images when a style is selected.
// Instructs Gemini to treat the images as visual style context ONLY —
// no objects, figures, places, or compositions may be reproduced.

export const STYLE_REFERENCE_PREAMBLE = `
╔══════════════════════════════════════════════════════════════╗
║              STYLE REFERENCE — READ THIS FIRST              ║
╚══════════════════════════════════════════════════════════════╝

The images that follow are provided as VISUAL STYLE REFERENCES ONLY.

Your sole task is to analyze HOW these works are made — the visual
language — not WHAT they depict.

EXTRACT and apply from these references:
  • Color palette — hue temperature, saturation level, tonal range
  • Line quality — weight, precision, character, edge treatment
  • Rendering technique — washes, hatching, flat fills, crosshatching,
    stippling, impasto, wet-on-wet, glazing, layering, etc.
  • Light and shadow — contrast level, diffusion, directionality
  • Texture and surface — smooth, granular, gestural, linear, organic
  • Compositional sensibility — rhythm, balance, use of negative space
  • Tonal mood — warmth, restraint, dynamism, delicacy, whimsy

STRICTLY FORBIDDEN — do NOT reproduce from these images:
  ✗ Any specific person, figure, face, portrait, or character depicted
  ✗ Any animal or creature shown in the reference images
  ✗ Any specific object, prop, tool, or artifact from the references
  ✗ Any building, architecture, landscape, or location depicted
  ✗ Any scene, composition, or spatial arrangement from the references
  ✗ Any text, lettering, symbols, or graphic marks shown
  ✗ Any color block or shape tied to specific depicted content

Think of yourself as a master artist who has deeply studied these works
to internalize a visual language — and is now applying that language
to a completely different, original, unrelated subject of their own.

The subject matter of your output is defined SOLELY by the generation
prompt below. The reference images inform ONLY the stylistic treatment.
══════════════════════════════════════════════════════════════════
`;

// ── Text Generation ────────────────────────────────────────────────────────────

/**
 * Generates plain text content using the Gemini API.
 * Useful for short prompts, descriptions, or refining user text.
 */
export const generateTextWithGemini = async (
  apiKey: string,
  prompt: string,
  systemInstruction?: string
): Promise<string> => {
  if (!apiKey) {
    throw new Error("No Gemini API key provided. Please add your API key in settings.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: { parts: [{ text: prompt }] },
      config: {
        systemInstruction: systemInstruction || "You are a helpful assistant.",
        temperature: 0.7,
      },
    });

    return response.text || '';
  } catch (error: any) {
    console.error("Gemini Text Generation Error:", error);
    throw new Error(error.message || "Failed to generate text.");
  }
};

// ── SVG Generation ─────────────────────────────────────────────────────────────

/**
 * Generates an SVG string based on the user's prompt.
 * When styleReferences are provided, they are prepended as multimodal style-
 * context parts — the model is instructed to extract visual style only, never
 * reproduce depicted subjects.
 */
export const generateSvgFromPrompt = async (
  apiKey: string,
  prompt: string,
  reference?: ReferenceFile,
  referenceUrl?: string,
  spacePrompt?: string,
  spaceKnowledge?: any[],
  styleReferences?: ReferenceFile[],
  aspectRatio: AspectRatio = 'square'
): Promise<string> => {
  if (!apiKey) {
    throw new Error("No Gemini API key provided. Please add your API key in settings.");
  }

  const { width, height } = ASPECT_RATIO_CONFIG[aspectRatio];

  try {
    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `
      You are a world-class expert in Scalable Vector Graphics (SVG) design and coding.
      Your task is to generate a high-quality, visually stunning, and detailed SVG based
      on the user's description of an object or item.

      ${spacePrompt ? `Additional Guidance for this Space: ${spacePrompt}` : ''}

      Guidelines:
      1.  **Output Format**: Return ONLY the raw SVG code. Do not wrap it in markdown
          code blocks (e.g., no \`\`\`xml). Do not add any conversational text before or after.
      2.  **Quality**: Use gradients, proper pathing, and distinct colors to create depth
          and visual appeal. Avoid simple stroked lines unless requested. The style should
          be "flat art" or "material design" unless the style reference or prompt specifies otherwise.
      3.  **Technical**:
          - Always include a \`viewBox\` attribute set to "0 0 ${width} ${height}".
          - Default canvas size: ${width}×${height}px.
          - Ensure the SVG is self-contained (no external references).
          - Use semantic IDs or classes if helpful, but inline styles are preferred.
    `;

    let fullPrompt = `Create an SVG representation of the following: "${prompt}"`;

    if (referenceUrl) {
      fullPrompt += `\n\nPlease use the following URL as a reference for the design: ${referenceUrl}`;
    }

    const parts: any[] = [];

    // 1. Style reference preamble + images (when a style is selected and refs exist)
    if (styleReferences && styleReferences.length > 0) {
      parts.push({ text: STYLE_REFERENCE_PREAMBLE });
      for (const ref of styleReferences) {
        parts.push({ inlineData: { mimeType: ref.mimeType, data: ref.data } });
      }
      // Separator before the actual generation prompt
      parts.push({ text: '\nGENERATION PROMPT (apply the style from the images above to this subject only):\n' });
    }

    // 2. Main generation prompt
    parts.push({ text: fullPrompt });

    // 3. Space knowledge context
    if (spaceKnowledge && spaceKnowledge.length > 0) {
      parts.push({ text: "\n\nAdditional reference knowledge from the current Space:" });
      for (const k of spaceKnowledge) {
        if (k.type === 'url') {
          parts.push({ text: `- Reference URL: ${k.value}` });
        } else if (k.type === 'file') {
          if (k.value.startsWith('data:')) {
            const [header, data] = k.value.split(',');
            const mimeType = header.split(':')[1].split(';')[0];
            parts.push({ inlineData: { mimeType, data } });
          } else {
            parts.push({ text: `- Reference File (${k.name}): ${k.value}` });
          }
        }
      }
    }

    // 4. User-attached file (personal reference — separate from style refs)
    if (reference) {
      if (reference.type === 'image' || reference.type === 'pdf') {
        parts.push({ inlineData: { mimeType: reference.mimeType, data: reference.data } });
        parts.push({ text: "\n\nPlease use the attached file as an additional reference." });
      } else if (reference.type === 'text') {
        parts.push({ text: `\n\nAdditional text reference:\n\n${reference.data}` });
      }
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.4,
        topP: 0.95,
        topK: 40,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        tools: [{ urlContext: {} }]
      },
    });

    const rawText = response.text || '';

    // Robust cleanup to extract just the SVG
    const svgMatch = rawText.match(/<svg[\s\S]*?<\/svg>/i);

    if (svgMatch && svgMatch[0]) {
      return svgMatch[0];
    } else {
      return rawText.replace(/```xml/g, '').replace(/```svg/g, '').replace(/```/g, '').trim();
    }

  } catch (error: any) {
    if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('API key not valid')) {
      throw new Error("Your Gemini API key is invalid. Please check it in your settings.");
    }
    if (error.message?.includes('PERMISSION_DENIED')) {
      throw new Error("API key permission denied. Make sure your key has access to the Gemini API.");
    }
    if (error.message?.includes('RESOURCE_EXHAUSTED') || error.message?.includes('quota')) {
      throw new Error("Your Gemini API quota has been exceeded. The free tier resets daily.");
    }
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to generate SVG.");
  }
};
