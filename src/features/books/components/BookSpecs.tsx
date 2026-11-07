import type { ReactNode } from 'react';
import {
  BuildingIcon,
  Calendar3Icon,
  JournalTextIcon,
  TranslateIcon,
} from '../../../components/icons';
import { formatLanguage, formatPublishedDate } from '../format';
import type { Book } from '../types';

/** A one-line "spec sheet" (publisher, date, pages, language); missing values are left out. */
export function BookSpecs({ book }: { book: Book }) {
  const specs: { label: string; value?: string; icon: ReactNode }[] = [
    { label: 'Publisher', value: book.publisher, icon: <BuildingIcon /> },
    { label: 'Published', value: formatPublishedDate(book.publishedDate), icon: <Calendar3Icon /> },
    {
      label: 'Pages',
      value: book.pageCount ? `${book.pageCount} pages` : undefined,
      icon: <JournalTextIcon />,
    },
    { label: 'Language', value: formatLanguage(book.language), icon: <TranslateIcon /> },
  ];
  const present = specs.filter((spec) => spec.value);
  if (present.length === 0) return null;

  return (
    <dl className="book-specs">
      {present.map(({ label, value, icon }) => (
        <div key={label} className="book-spec">
          <dt className="visually-hidden">{label}</dt>
          <dd title={label}>
            <span className="book-spec-icon">{icon}</span>
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
