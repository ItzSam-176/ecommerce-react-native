// hooks/useSort.js
import { useState, useCallback } from 'react';

export function useSort(
  initialSort = { column: 'created_at', ascending: false },
  context = 'default',
) {
  const [sortKey, setSortKey] = useState('CREATED_DESC');
  const [sortConfig, setSortConfig] = useState(initialSort);
  
  // Store the initial/default sort for reset functionality
  const [defaultSort] = useState(initialSort);

  const applySort = useCallback(
    key => {
      setSortKey(key);

      if (context === 'orders') {
        switch (key) {
          case 'TOTAL_ASC':
            setSortConfig({ column: 'total_price', ascending: true });
            return;
          case 'TOTAL_DESC':
            setSortConfig({ column: 'total_price', ascending: false });
            return;
          case 'QTY_ASC':
            setSortConfig({ column: 'quantity', ascending: true });
            return;
          case 'QTY_DESC':
            setSortConfig({ column: 'quantity', ascending: false });
            return;
          case 'CREATED_ASC':
            setSortConfig({ column: 'created_at', ascending: true });
            return;
          case 'CREATED_DESC':
          default:
            setSortConfig({ column: 'created_at', ascending: false });
            return;
        }
      }

      // fallback/default mapping
      switch (key) {
        case 'PRICE_ASC':
          setSortConfig({ column: 'price', ascending: true });
          break;
        case 'PRICE_DESC':
          setSortConfig({ column: 'price', ascending: false });
          break;
        case 'CREATED_ASC':
          setSortConfig({ column: 'created_at', ascending: true });
          break;
        case 'CREATED_DESC':
        default:
          setSortConfig({ column: 'created_at', ascending: false });
          break;
      }
    },
    [context],
  );

  // Reset function to go back to default sort
  const resetSort = useCallback(() => {
    setSortConfig(defaultSort);
    
    if (context === 'orders') {
      if (defaultSort.column === 'created_at' && !defaultSort.ascending) {
        setSortKey('CREATED_DESC');
      } else if (defaultSort.column === 'created_at' && defaultSort.ascending) {
        setSortKey('CREATED_ASC');
      }
    } else {
      setSortKey(defaultSort.ascending ? 'CREATED_ASC' : 'CREATED_DESC');
    }
  }, [context, defaultSort]);

  return { sortKey, sortConfig, applySort, resetSort };
}
