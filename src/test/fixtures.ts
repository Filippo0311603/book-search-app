import type { Volume, VolumesResponse } from '../features/books/types';

export function makeVolume(id: string, overrides: Partial<Volume['volumeInfo']> = {}): Volume {
  return {
    id,
    volumeInfo: {
      title: `Book ${id}`,
      authors: ['Jane Doe'],
      publishedDate: '2001-05-17',
      description: `<p>Description of <b>${id}</b></p>`,
      infoLink: `https://books.google.com/books?id=${id}`,
      imageLinks: { thumbnail: `http://books.google.com/cover/${id}.jpg` },
      ...overrides,
    },
  };
}

export function makeResponse(count: number, totalItems = 100, offset = 0): VolumesResponse {
  return {
    kind: 'books#volumes',
    totalItems,
    items: Array.from({ length: count }, (_, i) => makeVolume(`id${offset + i + 1}`)),
  };
}
