import { createMemoryStore } from '@/features/lib/server/memoryStore'

interface TestItem {
  id: string
  value: string
}

const SEED: TestItem[] = [
  { id: 'a', value: 'alpha' },
  { id: 'b', value: 'beta' },
]

describe('createMemoryStore', () => {
  it('getAll returns all seeded items', () => {
    const store = createMemoryStore<TestItem>(SEED)
    expect(store.getAll()).toEqual(SEED)
  })

  it('getById returns the matching item', () => {
    const store = createMemoryStore<TestItem>(SEED)
    expect(store.getById('a')).toEqual({ id: 'a', value: 'alpha' })
  })

  it('getById returns undefined for unknown id', () => {
    const store = createMemoryStore<TestItem>(SEED)
    expect(store.getById('z')).toBeUndefined()
  })

  it('insert appends the item and returns it', () => {
    const store = createMemoryStore<TestItem>(SEED)
    const item = { id: 'c', value: 'gamma' }
    const result = store.insert(item)
    expect(result).toEqual(item)
    expect(store.getAll()).toHaveLength(3)
    expect(store.getById('c')).toEqual(item)
  })

  it('update mutates only specified fields', () => {
    const store = createMemoryStore<TestItem>(SEED)
    const updated = store.update('a', { value: 'changed' })
    expect(updated).not.toBeNull()
    expect(updated!.id).toBe('a')
    expect(updated!.value).toBe('changed')
  })

  it('update returns null for unknown id', () => {
    const store = createMemoryStore<TestItem>(SEED)
    expect(store.update('z', { value: 'x' })).toBeNull()
  })

  it('remove deletes the item and returns true', () => {
    const store = createMemoryStore<TestItem>(SEED)
    const result = store.remove('a')
    expect(result).toBe(true)
    expect(store.getAll()).toHaveLength(1)
    expect(store.getById('a')).toBeUndefined()
  })

  it('remove returns false for unknown id', () => {
    const store = createMemoryStore<TestItem>(SEED)
    expect(store.remove('z')).toBe(false)
    expect(store.getAll()).toHaveLength(2)
  })

  it('reset restores seed state', () => {
    const store = createMemoryStore<TestItem>(SEED)
    store.insert({ id: 'c', value: 'gamma' })
    store.update('a', { value: 'changed' })
    expect(store.getAll()).toHaveLength(3)

    store.reset(SEED)
    expect(store.getAll()).toHaveLength(2)
    expect(store.getById('a')!.value).toBe('alpha')
    expect(store.getById('c')).toBeUndefined()
  })
})
