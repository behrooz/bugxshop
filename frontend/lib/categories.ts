/**
 * Builds a tree-ordered list of categories for dropdowns (roots first, then children with depth).
 * Each item has id, name, and depth (0 = root). Uses parent_id from API.
 */
export function categoriesToTreeOptions(categories: { id: number; name: string; parent_id?: number | null }[]) {
  const result: { id: number; name: string; depth: number }[] = []

  function addChildren(parentId: number | null, depth: number) {
    for (const c of categories) {
      const isRoot = parentId === null && (c.parent_id == null || c.parent_id === undefined)
      const isChild = parentId !== null && c.parent_id === parentId
      if (isRoot || isChild) {
        result.push({ id: c.id, name: c.name, depth })
        addChildren(c.id, depth + 1)
      }
    }
  }

  addChildren(null, 0)
  return result
}

/** Indent string for one level (used in category dropdown) */
export const CATEGORY_INDENT = '\u00A0\u00A0\u00A0' // non-breaking spaces

export function categoryOptionLabel(name: string, depth: number) {
  return (CATEGORY_INDENT.repeat(depth)) + name
}
