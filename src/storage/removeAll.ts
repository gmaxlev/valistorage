import { DEFAULT_PREFIX } from '../constants.ts'

interface Options {
  type?: 'localStorage' | 'sessionStorage'
  prefix?: string
}

function getKeys (storage: Storage, prefix: string): string[] {
  const keys: string[] = []

  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i)

    if (!key) {
      continue
    }

    if (!key.startsWith(prefix)) {
      continue
    }

    keys.push(key)
  }

  return keys
}

/**
 * Removes all values managed by the library
 *
 * @param options - Options
 * @param options.type - storage type (localStorage or sessionStorage)
 * @param options.prefix - prefix for the keys
 */
export function removeAll (options?: Options): void {
  const type = options?.type ?? 'localStorage'
  const prefix = options?.prefix ?? DEFAULT_PREFIX

  const storage = type === 'localStorage' ? window.localStorage : window.sessionStorage

  const keys = getKeys(storage, prefix)

  keys.forEach(key => {
    storage.removeItem(key)
  })
}
