/** Local placeholder when no image is uploaded (no external URLs). */
const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect fill='%23f0f0f0' width='400' height='300'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='16' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3E%D8%A8%D8%AF%D9%88%D9%86%20%D8%AA%D8%B5%D9%88%DB%8C%D8%B1%3C/text%3E%3C/svg%3E"

/**
 * Returns the image URL to display for a product.
 * Only uses uploaded/stored image_url (absolute or relative). Otherwise returns a local placeholder (no external services).
 */
export function getProductImageUrl(product: { id?: number; image_url?: string | null }, _width = 400, _height = 300): string {
  const url = product?.image_url?.trim()
  if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/'))) {
    return url
  }
  return PLACEHOLDER_IMAGE
}

export type ProductImageItem = { id?: number; url: string; thumbnail_url?: string | null; alt_text?: string | null; is_primary?: boolean }

/**
 * Returns gallery items for product detail: only from product.images if present, else single item from image_url or local placeholder.
 */
export function getProductGalleryImages(product: { id?: number; image_url?: string | null; images?: ProductImageItem[] }): ProductImageItem[] {
  const list = product?.images?.filter((img: ProductImageItem) => img?.url) || []
  if (list.length > 0) {
    return list.map((img: ProductImageItem) => ({
      id: img.id,
      url: img.url,
      thumbnail_url: img.thumbnail_url || img.url,
      alt_text: img.alt_text,
      is_primary: img.is_primary,
    }))
  }
  const url = product?.image_url?.trim()
  const single = url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/'))
    ? url
    : PLACEHOLDER_IMAGE
  return [{ url: single, thumbnail_url: single }]
}
