import { create } from 'zustand'
import { persist } from 'zustand/middleware'
let n = 0
const uid = () => `item-${Date.now()}-${++n}`
interface CartItem { id: string; product: any; quantidade: number; observacao: string }
interface CartStore {
  items: CartItem[]; tenantSlug: string | null
  addItem: (product: any, quantidade?: number) => void
  removeItem: (id: string) => void
  updateQuantidade: (id: string, quantidade: number) => void
  updateObservacao: (id: string, observacao: string) => void
  clearCart: () => void
  totalItems: () => number
  totalEstimado: () => number | null
}
export const useCartStore = create<CartStore>()(persist(
  (set, get) => ({
    items: [], tenantSlug: null,
    addItem: (product, quantidade = 1) => {
      const ex = get().items.find(i => i.product.id === product.id)
      if (ex) set(s => ({ items: s.items.map(i => i.product.id === product.id ? { ...i, quantidade: i.quantidade + quantidade } : i) }))
      else set(s => ({ items: [...s.items, { id: uid(), product, quantidade, observacao: '' }] }))
    },
    removeItem: id => set(s => ({ items: s.items.filter(i => i.id !== id) })),
    updateQuantidade: (id, quantidade) => {
      if (quantidade <= 0) { get().removeItem(id); return }
      set(s => ({ items: s.items.map(i => i.id === id ? { ...i, quantidade } : i) }))
    },
    updateObservacao: (id, observacao) => set(s => ({ items: s.items.map(i => i.id === id ? { ...i, observacao } : i) })),
    clearCart: () => set({ items: [] }),
    totalItems: () => get().items.reduce((a, i) => a + i.quantidade, 0),
    totalEstimado: () => {
      const items = get().items
      if (!items.some(i => i.product.preco !== null)) return null
      return items.reduce((a, i) => a + (i.product.preco ?? 0) * i.quantidade, 0)
    },
  }),
  { name: 'laserpro-cart', partialize: s => ({ items: s.items, tenantSlug: s.tenantSlug }) }
))
