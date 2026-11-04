import type { SyntheticEvent } from 'react';
import { PLACEHOLDER_COVER_URL } from '../constants';

interface BookCoverProps {
  src: string;
  title: string;
  large?: boolean;
}

export function BookCover({ src, title, large = false }: BookCoverProps) {
  const handleError = (event: SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;
    if (image.src !== PLACEHOLDER_COVER_URL) image.src = PLACEHOLDER_COVER_URL;
  };

  return (
    <img
      src={src}
      alt={`Cover of ${title}`}
      className={`book-cover rounded${large ? ' book-cover--large' : ''}`}
      loading={large ? 'eager' : 'lazy'}
      onError={handleError}
    />
  );
}
