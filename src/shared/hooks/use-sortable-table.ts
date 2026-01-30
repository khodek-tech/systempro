import { useState, useMemo, useCallback } from 'react';

export type SortDirection = 'asc' | 'desc';

export interface SortState<T extends string> {
  field: T | null;
  direction: SortDirection;
}

export interface UseSortableTableOptions<T, F extends string> {
  items: T[];
  getFieldValue: (item: T, field: F) => string;
  locale?: string;
}

export interface UseSortableTableReturn<T, F extends string> {
  sortedItems: T[];
  sortField: F | null;
  sortDirection: SortDirection;
  handleSort: (field: F) => void;
  resetSort: () => void;
}

/**
 * Hook for handling sortable table state
 *
 * @example
 * ```tsx
 * type SortField = 'fullName' | 'username' | 'role';
 *
 * const { sortedItems, sortField, sortDirection, handleSort } = useSortableTable<User, SortField>({
 *   items: users,
 *   getFieldValue: (user, field) => {
 *     switch (field) {
 *       case 'fullName': return user.fullName;
 *       case 'username': return user.username;
 *       case 'role': return getRoleNames(user.roleIds);
 *       default: return '';
 *     }
 *   },
 * });
 * ```
 */
export function useSortableTable<T, F extends string>({
  items,
  getFieldValue,
  locale = 'cs',
}: UseSortableTableOptions<T, F>): UseSortableTableReturn<T, F> {
  const [sortState, setSortState] = useState<SortState<F>>({
    field: null,
    direction: 'asc',
  });

  const handleSort = useCallback((field: F) => {
    setSortState((prev) => {
      if (prev.field === field) {
        return {
          field,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return {
        field,
        direction: 'asc',
      };
    });
  }, []);

  const resetSort = useCallback(() => {
    setSortState({ field: null, direction: 'asc' });
  }, []);

  const sortedItems = useMemo(() => {
    if (!sortState.field) return items;

    return [...items].sort((a, b) => {
      const aValue = getFieldValue(a, sortState.field!);
      const bValue = getFieldValue(b, sortState.field!);
      const result = aValue.localeCompare(bValue, locale);
      return sortState.direction === 'asc' ? result : -result;
    });
  }, [items, sortState.field, sortState.direction, getFieldValue, locale]);

  return {
    sortedItems,
    sortField: sortState.field,
    sortDirection: sortState.direction,
    handleSort,
    resetSort,
  };
}
