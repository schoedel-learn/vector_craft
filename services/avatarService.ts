import { createAvatar } from '@dicebear/core';
import * as collection from '@dicebear/collection';

export const getAvatarSvg = (style: string, seed: string) => {
  const styleFn = (collection as any)[style];
  if (!styleFn) return '';
  const avatar = createAvatar(styleFn, {
    seed: seed,
    size: 64,
  });
  return avatar.toString();
};
