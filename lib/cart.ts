import type { CartItem, Product } from './types';
const KEY = 'tia-accessories-cart';
export function readCartFromStorage(): CartItem[] { if (typeof window === 'undefined') return []; try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } }
export function writeCartToStorage(cart: CartItem[]) { if (typeof window !== 'undefined') localStorage.setItem(KEY, JSON.stringify(cart)); }
export function addCartItem(cart: CartItem[], product: Product, quantity: number) { const index = cart.findIndex((item) => item.id === product.id); if (index < 0) return [...cart, { ...product, quantity }]; return cart.map((item, i) => i === index ? { ...item, quantity: item.quantity + quantity } : item); }
export function removeCartItem(cart: CartItem[], index: number) { return cart.filter((_, i) => i !== index); }
export function updateCartItemQuantity(cart: CartItem[], index: number, quantity: number) { if (quantity <= 0) return removeCartItem(cart, index); return cart.map((item, i) => i === index ? { ...item, quantity } : item); }
