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
}

export interface ApiError {
  message: string;
  details?: string;
}
