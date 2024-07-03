import { describe, test, expect } from 'vitest'
import {
  getMigrationsSlice,
  isValidMigrations,
  normalize,
  isValidMigration,
  migrate
} from '../src/migrations/migrations.ts'
import { type Migration } from '../src/types.ts'

describe('migations', () => {
  describe('normalize()', () => {
    test('should return a sequence of versions', () => {
      const migrations = [
        {
          version: 3,
          up () {}
        },
        {
          version: 1,
          up () {}
        },
        {
          version: 2,
          up () {}
        }
      ]

      const result = normalize(migrations)

      expect(result).toEqual([
        expect.objectContaining({
          version: 1,
          up: expect.any(Function)
        }),
        expect.objectContaining({
          version: 2,
          up: expect.any(Function)
        }),
        expect.objectContaining({
          version: 3,
          up: expect.any(Function)
        })
      ])
    })
  })

  describe('getMigrationsSlice()', () => {
    test('should return null if there is no any migations', () => {
      const migrations: Migration[] = []

      const result = getMigrationsSlice(migrations, 1, 4)

      expect(result).toBeNull()
    })

    test('should return null if there is no the available migation path', () => {
      const migrations1 = [
        {
          version: 1,
          up () {}
        },
        {
          version: 2,
          up () {}
        },
        {
          version: 3,
          up () {}
        }
      ]

      const migrations2 = [
        {
          version: 1,
          up () {}
        },
        {
          version: 3,
          up () {}
        }
      ]

      const migrations3 = [
        {
          version: 5,
          up () {}
        },
        {
          version: 6,
          up () {}
        }
      ]

      const result1 = getMigrationsSlice(migrations1, 1, 5)
      expect(result1).toBeNull()

      const result2 = getMigrationsSlice(migrations2, 1, 3)
      expect(result2).toBeNull()

      const result3 = getMigrationsSlice(migrations2, 2, 3)
      expect(result3).toBeNull()

      const result4 = getMigrationsSlice(migrations2, 4, 5)
      expect(result4).toBeNull()

      const result5 = getMigrationsSlice(migrations3, 3, 4)
      expect(result5).toBeNull()
    })

    test('should return transactions slide if there is the available migation path', () => {
      const one = (): void => {}
      const two = (): void => {}
      const three = (): void => {}

      const migrations1 = [
        {
          version: 1,
          up: one
        },
        {
          version: 2,
          up: two
        },
        {
          version: 3,
          up: three
        }
      ]

      const result1 = getMigrationsSlice(migrations1, 1, 4)
      expect(result1).toEqual([
        {
          version: 1,
          up: one
        },
        {
          version: 2,
          up: two
        },
        {
          version: 3,
          up: three
        }
      ])

      const result2 = getMigrationsSlice(migrations1, 2, 3)
      expect(result2).toEqual([
        {
          version: 2,
          up: two
        }
      ])

      const result3 = getMigrationsSlice(migrations1, 1, 2)
      expect(result3).toEqual([
        {
          version: 1,
          up: one
        }
      ])
    })
  })

  describe('isValidMigraion()', () => {
    test('should return false if migrarions is not valid', () => {
      const result1 = isValidMigration(1)
      expect(result1).toBe(false)

      const result2 = isValidMigration(null)
      expect(result2).toBe(false)

      const result3 = isValidMigration([])
      expect(result3).toBe(false)

      const result4 = isValidMigration({})
      expect(result4).toBe(false)

      const result5 = isValidMigration({
        version: '1',
        up () {}
      })
      expect(result5).toBe(false)

      const result6 = isValidMigration({
        version: 1
      })
      expect(result6).toBe(false)

      const result7 = isValidMigration({
        version: 1,
        up: {}
      })
      expect(result7).toBe(false)

      const result8 = isValidMigration({
        version: 1,
        up () {},
        validate: {}
      })
      expect(result8).toBe(false)
    })

    test('should return true if migrarions is valid', () => {
      const result1 = isValidMigration({
        version: 1,
        up () {}
      })
      expect(result1).toBe(true)

      const result2 = isValidMigration({
        version: 1,
        up () {},
        validate () {}
      })
      expect(result2).toBe(true)
    })
  })

  describe('isValidMigrations()', () => {
    test('should return false if it is not valid migrations', () => {
      const result1 = isValidMigrations(null)
      expect(result1).toBe(false)

      const result2 = isValidMigrations(1)
      expect(result2).toBe(false)

      const result3 = isValidMigrations({})
      expect(result3).toBe(false)

      const result4 = isValidMigrations([
        {
          version: 1,
          up: () => {}
        },
        {
          version: '2',
          up: () => {}
        }
      ])
      expect(result4).toBe(false)
    })

    test('should return true if it is valid migrations', () => {
      const result1 = isValidMigrations([])
      expect(result1).toBe(true)

      const result2 = isValidMigrations([
        {
          version: 1,
          up: () => {}
        },
        {
          version: 2,
          up: () => {},
          validate: () => {}
        }
      ])
      expect(result2).toBe(true)
    })
  })

  describe('migrate', () => {
    test('should fail if migrations are not valid', () => {
      const result = migrate(
        {},
        {
          version: 1,
          value: 'string'
        },
        3
      )
      expect(result).toEqual({
        success: false
      })
    })

    test('should fail if migrations are empty', () => {
      const result = migrate([], { version: 1, value: 'string' }, 3)
      expect(result).toEqual({
        success: false
      })
    })

    test('should fail if there is not migrations', () => {
      const result1 = migrate(
        [
          {
            version: 7,
            up: () => {}
          },
          {
            version: 8,
            up: () => {}
          },
          {
            version: 9,
            up: () => {}
          }
        ],
        { version: 6, value: 'string' },
        10
      )
      expect(result1).toEqual({
        success: false
      })

      const result2 = migrate(
        [
          {
            version: 7,
            up: () => {}
          },
          {
            version: 9,
            up: () => {}
          }
        ],
        { version: 7, value: 'string' },
        10
      )
      expect(result2).toEqual({
        success: false
      })
    })

    test('should catch en error if validation function throw it', () => {
      const result1 = migrate(
        [
          {
            version: 12,
            validate (expectedObject: any) {
              return expectedObject.expectedProperty1.expectedProperty2
            },
            up (expectedObject: any) {
              return {
                ...expectedObject,
                newProp: 'newValue'
              }
            }
          }
        ],
        { version: 12, value: 'ping...' },
        13
      )
      expect(result1).toEqual({
        success: false
      })
    })

    test('should catch en error if up function throw it', () => {
      const result1 = migrate(
        [
          {
            version: 12,
            up (expectedObject: any) {
              return {
                expectedValue:
                  expectedObject.expectedProperty1.expectedProperty2 + 1
              }
            }
          }
        ],
        { version: 12, value: {} },
        13
      )
      expect(result1).toEqual({
        success: false
      })
    })

    test('should fail if validation do not pass', () => {
      const result1 = migrate(
        [
          {
            version: 12,
            validate (value: string) {
              return value === 'pong'
            },
            up (value: string) {
              return value + 'pong'
            }
          }
        ],
        { version: 12, value: 'ping...' },
        13
      )
      expect(result1).toEqual({
        success: false
      })

      const result2 = migrate(
        [
          {
            version: 12,
            validate (value: string) {
              return value === 'ping...'
            },
            up (value: string) {
              return value + 'pong...'
            }
          },
          {
            version: 13,
            validate (value: string) {
              return value === 'ping...ping'
            },
            up (value: string) {
              return value + 'pong'
            }
          }
        ],
        { version: 12, value: 'ping...' },
        14
      )
      expect(result2).toEqual({
        success: false
      })

      const result3 = migrate(
        [
          {
            version: 12,
            up (value: string) {
              return value + 'pong2...'
            }
          },
          {
            version: 13,
            up (value: string) {
              return value + 'ping3...'
            }
          },
          {
            version: 14,
            validate (value: string) {
              return value === 'ping1...pong2...ping3...ping4...'
            },
            up (value: string) {
              return value + 'pong4...'
            }
          },
          {
            version: 15,
            up (value: string) {
              return value + 'ping5...'
            }
          },
          {
            version: 16,
            up (value: string) {
              return value + 'pong6'
            }
          }
        ],
        { version: 12, value: 'ping1...' },
        17
      )
      expect(result3).toEqual({
        success: false
      })
    })

    test('should return the migrated value', () => {
      const result1 = migrate(
        [
          {
            version: 12,
            up (value: string) {
              return value + 'pong'
            }
          }
        ],
        { version: 12, value: 'ping...' },
        13
      )
      expect(result1).toEqual({
        success: true,
        value: 'ping...pong'
      })

      const result2 = migrate(
        [
          {
            version: 12,
            up (value: string) {
              return value + 'pong2...'
            }
          },
          {
            version: 13,
            up (value: string) {
              return value + 'ping3...'
            }
          },
          {
            version: 14,
            up (value: string) {
              return value + 'pong4...'
            }
          },
          {
            version: 15,
            up (value: string) {
              return value + 'ping5...'
            }
          },
          {
            version: 16,
            up (value: string) {
              return value + 'pong6'
            }
          }
        ],
        { version: 12, value: 'ping1...' },
        17
      )
      expect(result2).toEqual({
        success: true,
        value: 'ping1...pong2...ping3...pong4...ping5...pong6'
      })
    })

    test('should return the migrated value', () => {
      const result1 = migrate(
        [
          {
            version: 12,
            up (value: string) {
              return value + 'pong'
            }
          }
        ],
        { version: 12, value: 'ping...' },
        13
      )
      expect(result1).toEqual({
        success: true,
        value: 'ping...pong'
      })

      const result2 = migrate(
        [
          {
            version: 12,
            validate (value: string) {
              return value === 'ping1...'
            },
            up (value: string) {
              return value + 'pong2...'
            }
          },
          {
            version: 13,
            validate (value: string) {
              return value === 'ping1...pong2...'
            },
            up (value: string) {
              return value + 'ping3...'
            }
          },
          {
            version: 14,
            validate (value: string) {
              return value === 'ping1...pong2...ping3...'
            },
            up (value: string) {
              return value + 'pong4...'
            }
          },
          {
            version: 15,
            validate (value: string) {
              return value === 'ping1...pong2...ping3...pong4...'
            },
            up (value: string) {
              return value + 'ping5...'
            }
          },
          {
            version: 16,
            validate (value: string) {
              return value === 'ping1...pong2...ping3...pong4...ping5...'
            },
            up (value: string) {
              return value + 'pong6'
            }
          }
        ],
        { version: 12, value: 'ping1...' },
        17
      )
      expect(result2).toEqual({
        success: true,
        value: 'ping1...pong2...ping3...pong4...ping5...pong6'
      })
    })
  })
})
