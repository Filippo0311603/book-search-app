import { PLACEHOLDER_COVER_URL } from './constants';
import { htmlToText, sanitizeHtml } from './text';
import type { Book, SearchResult, Volume, VolumesResponse } from './types';

/** Google serves covers over http and adds a page-curl effect we do not want. */
export function normalizeImageUrl(url: string): string {
  return url.replace(/^http:\/\//i, 'https://').replace(/&edge=curl/i, '');
}

export function mapVolume(volume: Volume): Book {
  const info = volume.volumeInfo ?? {};
  const rawThumbnail = info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail;
  const links = info.imageLinks;
  const rawLarge =
    links?.large ?? links?.medium ?? links?.small ?? rawThumbnail ?? links?.extraLarge;
  const rawDescription = info.description ?? '';

  return {
    id: volume.id,
    title: info.title?.trim() || 'Untitled',
    subtitle: info.subtitle,
    authors: info.authors ?? [],
    publisher: info.publisher,
    publishedDate: info.publishedDate,
    description: htmlToText(rawDescription),
    descriptionHtml: sanitizeHtml(rawDescription),
    thumbnail: rawThumbnail ? normalizeImageUrl(rawThumbnail) : PLACEHOLDER_COVER_URL,
    coverLarge: rawLarge ? normalizeImageUrl(rawLarge) : PLACEHOLDER_COVER_URL,
    pageCount: info.pageCount,
    categories: info.categories ?? [],
    language: info.language,
    infoLink: info.infoLink,
  };
}

export function mapVolumesResponse(response: VolumesResponse): SearchResult {
  return {
    books: (response.items ?? []).map(mapVolume),
    totalItems: response.totalItems ?? 0,
  };
}
