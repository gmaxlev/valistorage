import { DEFAULT_PREFIX } from '../constants'
import { migrate } from '../migrations'
import { type Migration, type Version } from '../types'
import { pack, unpack } from './utils'
import { warn, IS_DEV } from '../utils'

function save (
  storage: Storage,
  key: string,
  version: Version,
  value: unknown,
  verbose: boolean
): boolean {
  try {
    const packed = pack(version, value)

    if (packed === null) {
      return false
    }

    storage.setItem(key, packed)
    return true
  } catch (e) {
    if (verbose && IS_DEV) {
      warn(
        'Failed to save data. I may happen due to memory limit or if you try to save object with circular references or for other reasons.'
      )
    }
    return false
  }
}

interface Options {
  key: string
  version: Version
  migrations?: Migration[]
  type?: 'localeStorage' | 'sessionStorage'
  validate?: (value: any) => boolean
  prefix?: string
  autoremove?: boolean
  verbose?: boolean
}

function validateOptions (options: Options): void {
  function fail (): void {
    if (IS_DEV) {
      warn(
        'You passed invalid options into "create" options. Please see docs.'
      )
    }
    throw new Error('[vstorage.create] Invalid Options')
  }

  if (typeof options !== 'object' || options === null) {
    fail()
  }

  if (typeof options.key !== 'string') {
    fail()
  }

  if (typeof options.version !== 'number') {
    fail()
  }

  if (options.migrations && !Array.isArray(options.migrations)) {
    fail()
  }

  if (
    'type' in options &&
    options.type !== 'localeStorage' &&
    options.type !== 'sessionStorage'
  ) {
    fail()
  }

  if (options.validate && typeof options.validate !== 'function') {
    fail()
  }

  if (options.prefix && typeof options.prefix !== 'string') {
    fail()
  }

  if (options.autoremove && typeof options.autoremove !== 'boolean') {
    fail()
  }

  if ('verbose' in options && typeof options.verbose !== 'boolean') {
    fail()
  }
}

interface Vstorage <Get, Set> {
  get: () => Get | null
  set: (value: Set) => void
  remove: () => void
}

export function create<Set, Get = Set> (options: Options): Vstorage<Get, Set> {
  validateOptions(options)

  const {
    version,
    validate,
    migrations,
    type = 'localeStorage',
    verbose = true,
    autoremove = true
  } = options

  const api =
    type === 'localeStorage' ? window.localStorage : window.sessionStorage

  const prefix = options.prefix ?? DEFAULT_PREFIX

  const key = `${prefix}${options.key}`

  function remove (): void {
    api.removeItem(key)
  }

  function clean (): void {
    if (autoremove) {
      remove()
    }
  }

  return {
    get (): Get | null {
      const raw = api.getItem(key)

      // value does not exist
      if (raw === null) {
        return null
      }

      const unpacked = unpack(raw, verbose)

      // unpacking failed
      if (unpacked === null) {
        return null
      }

      // the version is not outdated
      if (unpacked.version === version) {
        if (validate && !validate(unpacked.value)) {
          clean()
          return null
        }
        return unpacked.value as Get
      }

      // the version is outdated and there is no migrations
      if (!migrations) {
        clean()
        return null
      }

      // try to migrate
      const migration = migrate(migrations, unpacked, version)

      if (!migration.success) {
        clean()
        return null
      }

      if (validate && !validate(migration.value)) {
        // migration is success but validation failed
        clean()
        return null
      }

      save(api, key, version, migration.value, verbose)

      return migration.value as Get
    },
    set (value: Set) {
      return save(api, key, version, value, verbose)
    },
    remove () {
      remove()
    }
  }
}
