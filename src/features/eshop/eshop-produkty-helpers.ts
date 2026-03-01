import type { Category } from '@/shared/types';

// =============================================================================
// CATEGORY TREE
// =============================================================================

export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[];
  level: number;
}

/**
 * Build a tree structure from flat categories array.
 */
export function buildCategoryTree(categories: Category[]): CategoryTreeNode[] {
  const map = new Map<number, CategoryTreeNode>();
  const roots: CategoryTreeNode[] = [];

  // Create nodes
  for (const cat of categories) {
    map.set(cat.id, { ...cat, children: [], level: 0 });
  }

  // Build tree
  for (const node of map.values()) {
    if (node.parentId && map.has(node.parentId)) {
      const parent = map.get(node.parentId)!;
      node.level = parent.level + 1;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // Sort by order at each level
  const sortNodes = (nodes: CategoryTreeNode[]) => {
    nodes.sort((a, b) => a.order - b.order);
    for (const node of nodes) {
      sortNodes(node.children);
    }
  };
  sortNodes(roots);

  return roots;
}

/**
 * Flatten tree to sorted array (for display in lists).
 */
export function flattenCategoryTree(tree: CategoryTreeNode[]): CategoryTreeNode[] {
  const result: CategoryTreeNode[] = [];
  const walk = (nodes: CategoryTreeNode[]) => {
    for (const node of nodes) {
      result.push(node);
      walk(node.children);
    }
  };
  walk(tree);
  return result;
}

// =============================================================================
// SLUG GENERATION
// =============================================================================

const CZECH_MAP: Record<string, string> = {
  á: 'a', č: 'c', ď: 'd', é: 'e', ě: 'e', í: 'i', ň: 'n',
  ó: 'o', ř: 'r', š: 's', ť: 't', ú: 'u', ů: 'u', ý: 'y', ž: 'z',
};

/**
 * Generate URL-safe slug from text (supports Czech diacritics).
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .split('')
    .map((ch) => CZECH_MAP[ch] || ch)
    .join('')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}
