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
    // The frame draws the book look (rounded right edge, spine highlight, shadow) in CSS.
    <span className={`book-cover-frame${large ? ' book-cover-frame--large' : ''}`}>
      <img
        src={src}
        alt={`Cover of ${title}`}
        className="book-cover"
        loading={large ? 'eager' : 'lazy'}
        decoding="async"
        onError={handleError}
      />
    </span>
  );
}
