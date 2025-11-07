import { useState, useCallback } from 'react';

export function useSort(
  initialSort = { column: 'created_at', ascending: false },
  context = 'default',
) {
  const [sortKey, setSortKey] = useState('CREATED_DESC');
  const [sortConfig, setSortConfig] = useState(initialSort);
  const [defaultSort] = useState(initialSort);

  const applySort = useCallback(
    key => {
      setSortKey(key);

      if (context === 'orders') {
        switch (key) {
          case 'CREATED_ASC':
            setSortConfig({ column: 'created_at', ascending: true });
            break;
          case 'CREATED_DESC':
            setSortConfig({ column: 'created_at', ascending: false });
            break;
          case 'ITEMS_ASC':
            setSortConfig({ column: 'items_count', ascending: true });
            break;
          case 'ITEMS_DESC':
            setSortConfig({ column: 'items_count', ascending: false });
            break;
          case 'SUBTOTAL_ASC':
            setSortConfig({ column: 'subtotal', ascending: true });
            break;
          case 'SUBTOTAL_DESC':
            setSortConfig({ column: 'subtotal', ascending: false });
            break;
          case 'COUPON_ASC':
            setSortConfig({ column: 'coupon_amount', ascending: true });
            break;
          case 'COUPON_DESC':
            setSortConfig({ column: 'coupon_amount', ascending: false });
            break;
          case 'DELIVERY_ASC':
            setSortConfig({ column: 'delivery_charge', ascending: true });
            break;
          case 'DELIVERY_DESC':
            setSortConfig({ column: 'delivery_charge', ascending: false });
            break;
          case 'TOTAL_ASC':
            setSortConfig({ column: 'total_amount', ascending: true });
            break;
          case 'TOTAL_DESC':
            setSortConfig({ column: 'total_amount', ascending: false });
            break;
          default:
            setSortConfig({ column: 'created_at', ascending: false });
        }
        return;
      }

      switch (key) {
        case 'NAME_ASC':
          setSortConfig({ column: 'name', ascending: true });
          break;
        case 'NAME_DESC':
          setSortConfig({ column: 'name', ascending: false });
          break;
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
