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
    // The frame keeps the layout box and sets the perspective; .book-cover-book is the 3D object.
    // The two empty spans are decorative (back cover, page edges), drawn entirely in CSS.
    <span className={`book-cover-frame${large ? ' book-cover-frame--large' : ''}`}>
      <span className="book-cover-book">
        <span className="book-cover-back" aria-hidden="true" />
        <span className="book-cover-pages" aria-hidden="true" />
        <img
          src={src}
          alt={`Cover of ${title}`}
          className="book-cover"
          loading={large ? 'eager' : 'lazy'}
          decoding="async"
          onError={handleError}
        />
      </span>
    </span>
  );
}
