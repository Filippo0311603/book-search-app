import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { GOOGLE_BOOKS_BASE_URL } from '../services/googleBooksApi';
import { makeResponse, makeVolume } from './fixtures';

export const VOLUMES_URL = `${GOOGLE_BOOKS_BASE_URL}/volumes`;

/** Default happy-path handlers; individual tests override them with `server.use`. */
export const handlers = [
  http.get(VOLUMES_URL, ({ request }) => {
    const params = new URL(request.url).searchParams;
    const start = Number(params.get('startIndex') ?? 0);
    const max = Number(params.get('maxResults') ?? 10);
    return HttpResponse.json(makeResponse(max, 100, start));
  }),
  http.get(`${VOLUMES_URL}/:id`, ({ params }) => HttpResponse.json(makeVolume(String(params.id)))),
];

export const server = setupServer(...handlers);
