import type { CSSProperties } from 'react';

// Five CSS-only books on a shelf. --c1/--c2: cover gradient, --w/--h: size in em, --i: stagger.
const BOOKS = [
  { c1: '#ff5039', c2: '#c0261b', w: 2.6, h: 8.5 },
  { c1: '#2b3a67', c2: '#151a2c', w: 3.1, h: 10.2 },
  { c1: '#f2a516', c2: '#d9780b', w: 2.4, h: 7.6 },
  { c1: '#1f8a6b', c2: '#14584a', w: 2.9, h: 9.4 },
  { c1: '#e8dcc2', c2: '#b8a47e', w: 2.5, h: 8.1 },
];

/** Decorative floating bookshelf for the empty state. Hidden from assistive tech; see _shelf.scss. */
export function HeroShelf() {
  return (
    <div className="hero-shelf" aria-hidden="true">
      {BOOKS.map((book, index) => (
        <span
          key={book.c1}
          className="book-cover-book shelf-book"
          style={
            {
              '--c1': book.c1,
              '--c2': book.c2,
              '--w': `${book.w}em`,
              '--h': `${book.h}em`,
              '--i': index,
            } as CSSProperties
          }
        >
          <span className="book-cover-back" />
          <span className="book-cover-pages" />
          <span className="shelf-book-front" />
        </span>
      ))}
    </div>
  );
}
