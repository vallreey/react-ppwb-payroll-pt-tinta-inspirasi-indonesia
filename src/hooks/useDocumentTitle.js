import { useEffect } from 'react';

export const useDocumentTitle = (title) => {
  useEffect(() => {
    document.title = `${title} | Tinta Inspirasi Indonesia`;
  }, [title]);
};
