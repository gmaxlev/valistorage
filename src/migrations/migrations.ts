import { type Migration, type Version, type VstorageData } from '../types'
import { warn, IS_DEV } from '../utils'

const message = `"migrations" should be an array that includes the following objects:

Array<{
    version: number;
    up: (value: unknown) => unknown;
    validate?: (value: unknown) => boolean;
}>
`

export function isValidMigration (migration: unknown): migration is Migration {
  if (typeof migration !== 'object' || migration === null) {
    if (IS_DEV) {
      warn(message)
    }
    return false
  }

  if (!('version' in migration) || typeof migration.version !== 'number') {
    if (IS_DEV) {
      warn(message)
    }
    return false
  }

  if (!('up' in migration) || typeof migration.up !== 'function') {
    if (IS_DEV) {
      warn(message)
    }
    return false
  }

  if ('validate' in migration && typeof migration.validate !== 'function') {
    if (IS_DEV) {
      warn(message)
    }
    return false
  }

  return true
}

export function isValidMigrations (
  migrations: unknown
): migrations is Migration[] {
  if (!Array.isArray(migrations)) {
    if (IS_DEV) {
      warn(message)
    }
    return false
  }
  return migrations.every((migration) => isValidMigration(migration))
}

export function normalize (migrations: Migration[]): Migration[] {
  return migrations.sort((a, b) => a.version - b.version)
}

export function isExistingMigration (
  normalizedMigrations: Migration[],
  from: Version,
  to: Version
): boolean {
  if (normalizedMigrations.length <= 0) {
    return false
  }

  const start = normalizedMigrations.findIndex((item) => item.version === from)

  if (start === -1) {
    return false
  }

  const finish = to - 1

  let prev = from - 1

  for (let i = start; i < normalizedMigrations.length; i++) {
    const { version } = normalizedMigrations[i]

    if (prev !== version - 1) {
      return false
    }

    if (version === finish) {
      return true
    }

    prev = version
  }

  return false
}

export function getMigrationsSlice (
  migrations: Migration[],
  from: Version,
  to: Version
): Migration[] | null {
  const normalized = normalize(migrations)

  if (!isExistingMigration(normalized, from, to)) {
    return null
  }

  const fromIndex = normalized.findIndex((item) => item.version === from)
  const toIndex = normalized.findIndex((item) => item.version === to - 1)

  if (fromIndex === -1 || toIndex === -1) {
    return null
  }

  const slice = normalized.slice(fromIndex, toIndex + 1)

  return slice
}

function execute (migrations: Migration[], current: unknown): { readonly success: false, readonly value?: undefined } | { readonly success: true, readonly value: unknown } {
  let last = current

  try {
    for (let i = 0; i < migrations.length; i++) {
      const migration = migrations[i]

      if (migration.validate && !migration.validate(last)) {
        return {
          success: false
        } as const
      }

      last = migration.up(last)
    }
  } catch (e) {
    return {
      success: false
    } as const
  }

  return {
    success: true,
    value: last
  } as const
}

export function migrate (
  migrations: unknown,
  current: VstorageData,
  to: Version
): { readonly success: false, readonly value?: undefined } | { readonly success: true, readonly value: unknown } {
  if (!isValidMigrations(migrations)) {
    return {
      success: false
    } as const
  }

  if (migrations.length <= 0) {
    return {
      success: false
    } as const
  }

  const slice = getMigrationsSlice(migrations, current.version, to)

  if (slice === null) {
    return {
      success: false
    } as const
  }

  return execute(migrations, current.value)
}
