/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, ThinkingLevel } from "@google/genai";

export interface ReferenceFile {
  type: 'image' | 'text' | 'pdf';
  mimeType: string;
  data: string; // base64 for image/pdf, raw string for text
}

/**
 * Generates an SVG string based on the user's prompt.
 * Uses 'gemini-3-flash-preview' for faster generation.
 * The API key is provided per-call (BYOK architecture).
 */
export const generateSvgFromPrompt = async (
  apiKey: string,
  prompt: string, 
  reference?: ReferenceFile, 
  referenceUrl?: string,
  spacePrompt?: string,
  spaceKnowledge?: any[]
): Promise<string> => {
  if (!apiKey) {
    throw new Error("No Gemini API key provided. Please add your API key in settings.");
  }

  try {
    // Create a fresh client with the user's own API key
    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `
      You are a world-class expert in Scalable Vector Graphics (SVG) design and coding. 
      Your task is to generate a high-quality, visually stunning, and detailed SVG based on the user's description of an object or item.
      
      ${spacePrompt ? `Additional Guidance for this Space: ${spacePrompt}` : ''}

      Guidelines:
      1.  **Output Format**: Return ONLY the raw SVG code. Do not wrap it in markdown code blocks (e.g., no \`\`\`xml). Do not add any conversational text before or after.
      2.  **Quality**: Use gradients, proper pathing, and distinct colors to create depth and visual appeal. Avoid simple stroked lines unless requested. The style should be "flat art" or "material design" unless specified otherwise.
      3.  **Technical**: 
          - Always include a \`viewBox\` attribute.
          - Ensure the SVG is self-contained (no external references).
          - Use semantic IDs or classes if helpful, but inline styles are preferred for portability.
          - Default size should be square (e.g., 512x512) unless the aspect ratio suggests otherwise.
    `;

    let fullPrompt = `Create an SVG representation of the following object/item: "${prompt}"`;
    
    if (referenceUrl) {
      fullPrompt += `\n\nPlease use the following URL as a reference for the design: ${referenceUrl}`;
    }

    const parts: any[] = [{ text: fullPrompt }];

    // Add space knowledge if available
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
    
    if (reference) {
      if (reference.type === 'image' || reference.type === 'pdf') {
        parts.unshift({ inlineData: { mimeType: reference.mimeType, data: reference.data } });
        parts.push({ text: "\n\nPlease use the attached file as a primary reference for the SVG." });
      } else if (reference.type === 'text') {
        parts.push({ text: `\n\nPlease use the following text as a primary reference:\n\n${reference.data}` });
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
    
    // Robust cleanup to extract just the SVG part
    const svgMatch = rawText.match(/<svg[\s\S]*?<\/svg>/i);
    
    if (svgMatch && svgMatch[0]) {
      return svgMatch[0];
    } else {
      // If regex fails, return raw text but warn/handle in UI if it's not valid
      // For now, we assume the model follows instructions well due to the system prompt.
      // If the model returns markdown, we try to strip it.
      return rawText.replace(/```xml/g, '').replace(/```svg/g, '').replace(/```/g, '').trim();
    }

  } catch (error: any) {
    // Provide user-friendly messages for common API key errors
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
