import type { CSSProperties } from 'react';

export const fikerAvatarPoses = [
  'coffee',
  'thinking',
  'explaining',
  'thumbsup',
  'pointing-left',
  'pointing-right',
  'laptop',
  'notebook',
  'lightbulb',
  'excited',
  'phone',
  'listening',
  'waving',
  'confidence',
  'sitting-perch',
  'sitting-crosslegged',
  'sitting-laptop',
  'sitting-side',
] as const;

export type FikerAvatarPose = (typeof fikerAvatarPoses)[number];

export interface FikerAvatarProps {
  pose: FikerAvatarPose;
  size?: number | string;
  className?: string;
  alt?: string;
}

const ASSET_ROOT = '/assets/fiker-avatar-pack';

export function FikerAvatar({
  pose,
  size = 320,
  className,
  alt = `Fiker avatar: ${pose.replace('-', ' ')}`,
}: FikerAvatarProps) {
  const width = typeof size === 'number' ? `${size}px` : size;
  const style: CSSProperties = {
    display: 'block',
    width,
    maxWidth: '100%',
    height: 'auto',
  };

  // Serve the lightweight web WebP where supported, falling back to the
  // canonical full-resolution PNG (used for social/video) elsewhere.
  return (
    <picture>
      <source srcSet={`${ASSET_ROOT}/${pose}.webp`} type="image/webp" />
      <img
        src={`${ASSET_ROOT}/${pose}.png`}
        alt={alt}
        className={className}
        style={style}
        loading="lazy"
        decoding="async"
      />
    </picture>
  );
}

export default FikerAvatar;
