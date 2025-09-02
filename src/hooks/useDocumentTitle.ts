import { useEffect } from 'react';

export const useDocumentTitle = (title: string) => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${title} | STEPUP - Tienda`;

    return () => {
      document.title = previousTitle;
    };
  }, [title]);
};