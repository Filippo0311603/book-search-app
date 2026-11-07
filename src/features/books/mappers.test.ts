import { describe, expect, it } from 'vitest';
import { makeVolume } from '../../test/fixtures';
import { PLACEHOLDER_COVER_URL } from './constants';
import { mapVolume, mapVolumesResponse } from './mappers';

describe('mapVolume', () => {
  it('upgrades http thumbnails to https and drops the curl effect', () => {
    const book = mapVolume(
      makeVolume('a', {
        imageLinks: { thumbnail: 'http://books.google.com/x.jpg?id=a&edge=curl' },
      }),
    );
    expect(book.thumbnail).toBe('https://books.google.com/x.jpg?id=a');
  });

  it('falls back to smallThumbnail, then to the placeholder', () => {
    expect(
      mapVolume(makeVolume('a', { imageLinks: { smallThumbnail: 'http://x/s.jpg' } })).thumbnail,
    ).toBe('https://x/s.jpg');
    const book = mapVolume(makeVolume('a', { imageLinks: undefined }));
    expect(book.thumbnail).toBe(PLACEHOLDER_COVER_URL);
    expect(book.coverLarge).toBe(PLACEHOLDER_COVER_URL);
  });

  it('prefers the smaller large covers and keeps extraLarge as the last resort', () => {
    const covers = (imageLinks: object) => mapVolume(makeVolume('a', { imageLinks })).coverLarge;
    expect(covers({ extraLarge: 'x/xl', large: 'x/l', medium: 'x/m', thumbnail: 'x/t' })).toBe(
      'x/l',
    );
    expect(covers({ extraLarge: 'x/xl', medium: 'x/m', small: 'x/s' })).toBe('x/m');
    expect(covers({ extraLarge: 'x/xl', small: 'x/s' })).toBe('x/s');
    expect(covers({ extraLarge: 'x/xl', thumbnail: 'x/t' })).toBe('x/t');
    expect(covers({ extraLarge: 'x/xl' })).toBe('x/xl');
  });

  it('strips HTML from the plain description and sanitizes the rich one', () => {
    const book = mapVolume(
      makeVolume('a', {
        description:
          '<p>Hello<br>world</p><script>alert(1)</script><a href="x" onclick="y()">link</a>',
      }),
    );
    expect(book.description).toBe('Hello world link');
    expect(book.descriptionHtml).not.toMatch(/script|onclick|<a/);
    expect(book.descriptionHtml).toContain('<p>Hello<br>world</p>');
  });

  it('provides safe defaults for missing fields', () => {
    const book = mapVolume({ id: 'z' });
    expect(book).toMatchObject({
      id: 'z',
      title: 'Untitled',
      authors: [],
      categories: [],
      description: '',
      thumbnail: PLACEHOLDER_COVER_URL,
    });
  });
});

describe('infoLink', () => {
  const PLAY = 'https://play.google.com/store/books/details?id=a&source=gbs_api';
  const PREVIEW = 'http://books.google.it/books?id=a&hl=&source=gbs_api';
  const link = (saleability: string | undefined, info: object) =>
    mapVolume({ ...makeVolume('a', info), saleInfo: { saleability } }).infoLink;

  it('replaces a Play Store link of a volume not sold on Play with its Google Books page', () => {
    expect(link('NOT_FOR_SALE', { infoLink: PLAY, previewLink: PREVIEW })).toBe(
      'https://books.google.it/books?id=a&hl=&source=gbs_api',
    );
  });

  it('keeps infoLink in every other case', () => {
    expect(link('FOR_SALE', { infoLink: PLAY, previewLink: PREVIEW })).toBe(PLAY);
    expect(link('FREE', { infoLink: PLAY, previewLink: PREVIEW })).toBe(PLAY);
    expect(link(undefined, { infoLink: PLAY, previewLink: PREVIEW })).toBe(PLAY);
    expect(link('NOT_FOR_SALE', { infoLink: PLAY, previewLink: undefined })).toBe(PLAY);
    const books = 'http://books.google.it/books?id=a&dq=x&source=gbs_api';
    expect(link('NOT_FOR_SALE', { infoLink: books, previewLink: PREVIEW })).toBe(books);
  });
});

describe('mapVolumesResponse', () => {
  it('handles responses without items', () => {
    expect(mapVolumesResponse({ totalItems: 0 })).toEqual({ books: [], totalItems: 0 });
  });
});
