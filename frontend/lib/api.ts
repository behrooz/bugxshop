import axios from 'axios'

// Server (SSR): call backend directly. Browser: use same-origin /api/v1 so Next rewrites to backend (no CORS).
const isServer = typeof window === 'undefined'
const raw = isServer
  ? (process.env.NEXT_PUBLIC_API_BACKEND || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/api\/v1\/?$/, '').replace(/\/?$/, '')
  : ''
export const API_BASE = raw ? raw + '/api/v1' : '/api/v1'
/** Backend origin for health check. Server: full URL. Browser: '' so fetch('/health') uses rewrite. */
export const API_ORIGIN = raw

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

export async function getProducts(params: { page?: number; limit?: number; category_id?: string } = {}) {
  try {
    const response = await api.get('/products', { params })
    return response.data.products || []
  } catch (error) {
    console.error('Error fetching products:', error)
    return []
  }
}

export async function getProduct(id: string) {
  try {
    const response = await api.get(`/products/${id}`)
    return response.data
  } catch (error) {
    console.error('Error fetching product:', error)
    throw error
  }
}

export async function searchProducts(query: string) {
  try {
    const response = await api.get('/products/search', { params: { q: query } })
    return response.data.products || []
  } catch (error) {
    console.error('Error searching products:', error)
    return []
  }
}

export async function getCategories() {
  try {
    const response = await api.get('/categories')
    return response.data.categories || []
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

export async function getCart(sessionId?: string) {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    const headers: any = { 'Content-Type': 'application/json' }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    if (sessionId) {
      headers['X-Session-ID'] = sessionId
    }
    const response = await api.get('/cart', { headers })
    return response.data
  } catch (error) {
    console.error('Error fetching cart:', error)
    return { items: [], total: 0 }
  }
}

export async function addToCart(productId: number, quantity: number, variantId?: number) {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    const sessionId = typeof window !== 'undefined' ? localStorage.getItem('sessionId') : null
    const headers: any = { 'Content-Type': 'application/json' }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    if (sessionId) {
      headers['X-Session-ID'] = sessionId
    }
    const response = await api.post('/cart', {
      product_id: productId,
      quantity,
      variant_id: variantId,
    }, { headers })
    return response.data
  } catch (error) {
    console.error('Error adding to cart:', error)
    throw error
  }
}

export async function createOrder(orderData: any) {
  try {
    const response = await api.post('/orders', orderData)
    return response.data
  } catch (error) {
    console.error('Error creating order:', error)
    throw error
  }
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

export async function getProfile() {
  const response = await fetch(`${API_BASE}/user/profile`, { headers: getAuthHeaders() })
  if (!response.ok) throw new Error('Unauthorized')
  return response.json()
}

export async function updateProfile(data: {
  first_name?: string
  last_name?: string
  email?: string
  mobile?: string
  birth_date?: string
  gender?: string
}) {
  const response = await fetch(`${API_BASE}/user/profile`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  const json = await response.json()
  if (!response.ok) throw new Error(json.error || 'خطا در به‌روزرسانی')
  return json
}

