export interface MemoryStore<T extends { id: string }> {
  getAll(): T[]
  getById(id: string): T | undefined
  insert(item: T): T
  update(id: string, patch: Partial<T>): T | null
  remove(id: string): boolean
  reset(seed: T[]): void
}

export function createMemoryStore<T extends { id: string }>(seed: T[]): MemoryStore<T> {
  let items: T[] = JSON.parse(JSON.stringify(seed))
  return {
    getAll: () => items,
    getById: (id) => items.find(i => i.id === id),
    insert: (item) => { items.push(item); return item },
    update: (id, patch) => {
      const i = items.findIndex(x => x.id === id)
      if (i === -1) return null
      items[i] = { ...items[i], ...patch }
      return items[i]
    },
    remove: (id) => {
      const before = items.length
      items = items.filter(x => x.id !== id)
      return items.length < before
    },
    reset: (newSeed) => { items = JSON.parse(JSON.stringify(newSeed)) },
  }
}
