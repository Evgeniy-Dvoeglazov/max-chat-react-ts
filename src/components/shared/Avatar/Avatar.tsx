import './Avatar.css';

interface AvatarProps {
  src: string | null;
  name: string;
}

export function Avatar({ src, name }: AvatarProps) {
  const fallback = name[0]?.toUpperCase() ?? '?';

  if (src) {
    return <img className='avatar' src={src} alt={name} />;
  }

  return <span className='avatar'>{fallback}</span>;
}
