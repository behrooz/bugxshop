/**
 * Returns the image URL to display for a product.
 * Uses product.image_url if it's an absolute URL (uploaded/stored); otherwise a placeholder per product.
 */
export function getProductImageUrl(product: { id: number; image_url?: string | null }, width = 400, height = 300): string {
  const url = product?.image_url?.trim()
  if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
    return url
  }
  return `https://picsum.photos/seed/${product?.id ?? 0}/${width}/${height}`
}

export type ProductImageItem = { id?: number; url: string; thumbnail_url?: string | null; alt_text?: string | null; is_primary?: boolean }

/**
 * Returns gallery items for product detail: from product.images if present, else single item from image_url or placeholder.
 */
export function getProductGalleryImages(product: { id: number; image_url?: string | null; images?: ProductImageItem[] }): ProductImageItem[] {
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
  const single = getProductImageUrl(product, 800, 800)
  return [{ url: single, thumbnail_url: single }]
}
