import { describe, test, expect, afterEach } from 'vitest'
import { create } from './create.ts'

describe('create', () => {
  afterEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  describe('create()', () => {
    test('should throw en error if options are invdalid', () => {
      // @ts-expect-error: intentionally use the wrong type
      const act1 = () => create({})
      expect(act1).toThrowError()

      // @ts-expect-error: intentionally use the wrong type
      const act2 = (): void => create({ key: 1 })
      expect(act2).toThrowError()

      const act3 = () =>
        create({
          key: 'user',
          // @ts-expect-error: intentionally use the wrong type
          version: '1'
        })
      expect(act3).toThrowError()

      const act4 = () =>
        create({
          key: 'user',
          version: 1,
          // @ts-expect-error: intentionally use the wrong type
          migrations: {}
        })
      expect(act4).toThrowError()

      const act5 = () =>
        create({
          key: 'user',
          version: 1,
          migrations: [],
          // @ts-expect-error:  intentionally use the wrong type
          type: 'session-storage'
        })
      expect(act5).toThrowError()

      const act6 = () =>
        create({
          key: 'user',
          version: 1,
          migrations: [],
          type: 'sessionStorage',
          // @ts-expect-error:  intentionally use the wrong type
          validate: []
        })
      expect(act6).toThrowError()

      const act7 = () =>
        create({
          key: 'user',
          version: 1,
          migrations: [],
          type: 'sessionStorage',
          validate: Array.isArray,
          // @ts-expect-error:  intentionally use the wrong type
          prefix: 1
        })
      expect(act7).toThrowError()

      const act8 = () =>
        create({
          key: 'user',
          version: 1,
          migrations: [],
          type: 'sessionStorage',
          validate: Array.isArray,
          prefix: 'custom',
          // @ts-expect-error:  intentionally use the wrong type
          autoRemove: 'true'
        })
      expect(act8).toThrowError()

      const act9 = () =>
        create({
          key: 'user',
          version: 1,
          migrations: [],
          type: 'sessionStorage',
          validate: Array.isArray,
          prefix: 'custom',
          autoRemove: false,
          // @ts-expect-error:  intentionally use the wrong type
          verbose: 'false'
        })
      expect(act9).toThrowError()
    })

    test('should return null if value does not exist', () => {
      const storage = create<{ user: string }>({
        key: 'user',
        version: 1
      })

      const value = storage.get()

      expect(value).toBeNull()
    })

    test('should save and return value', () => {
      const storage = create<{ user: string }>({
        key: 'user',
        version: 1
      })

      storage.set({ user: 'max' })

      const value = storage.get()

      expect(value).toEqual({
        user: 'max'
      })
    })

    test('should overrite and return value', () => {
      const storage = create<{ user: string }>({
        key: 'user',
        version: 1
      })

      storage.set({ user: 'max' })
      storage.set({ user: 'john' })

      const value = storage.get()

      expect(value).toEqual({
        user: 'john'
      })
    })

    test('should save and remove value', () => {
      const storage = create<{ user: string }>({
        key: 'user',
        version: 1,
        type: 'sessionStorage'
      })

      storage.set({ user: 'max' })
      storage.set({ user: 'john' })

      const value1 = storage.get()

      expect(value1).toEqual({
        user: 'john'
      })

      storage.remove()

      const value2 = storage.get()

      expect(value2).toBeNull()
    })

    test('should use custom prefix', () => {
      const storage = create<{ foo: 'bar' }>({
        key: 'user',
        version: 1,
        prefix: '_test_',
        type: 'sessionStorage'
      })

      storage.set({ foo: 'bar' })

      const raw = sessionStorage.getItem('_test_user')

      expect(raw).toBe('{"version":1,"value":{"foo":"bar"}}')
    })

    test('should use localStorage by default', () => {
      const storage = create<{ foo: 'bar' }>({
        key: 'user',
        version: 1,
        prefix: '_test_2_',
        type: 'localStorage'
      })

      storage.set({ foo: 'bar' })

      const raw = localStorage.getItem('_test_2_user')

      expect(raw).toBe('{"version":1,"value":{"foo":"bar"}}')
    })

    test('should use localStorage if it is specified', () => {
      const storage = create<{ foo: 'bar' }>({
        key: 'user',
        version: 1,
        prefix: '_test_3_',
        type: 'sessionStorage'
      })

      storage.set({ foo: 'bar' })

      const raw = sessionStorage.getItem('_test_3_user')

      expect(raw).toBe('{"version":1,"value":{"foo":"bar"}}')
    })

    test('should remove old data if there is migrations is empty', () => {
      const sessionStorageKey = '_test_user'

      const oldValue = {
        version: 4,
        value: 1024
      }

      sessionStorage.setItem(sessionStorageKey, JSON.stringify(oldValue))

      const storage = create<{
        user: {
          name: string
        }
      }>({
        key: 'user',
        version: 5,
        prefix: '_test_',
        type: 'sessionStorage',
        migrations: []
      })

      const value = storage.get()
      expect(value).toBeNull()

      const sessionStorageValue = sessionStorage.getItem(sessionStorageKey)
      // expect that old value has been removed
      expect(sessionStorageValue).toBeNull()
    })

    test('should not remove old data if there is migrations is empty and autoRemove is false', () => {
      const sessionStorageKey = '_test_user'

      const oldValue = {
        version: 4,
        value: 1024
      }

      const currentRawValue = JSON.stringify(oldValue)

      sessionStorage.setItem(sessionStorageKey, currentRawValue)

      const storage = create<{
        user: {
          name: string
        }
      }>({
        key: 'user',
        version: 5,
        prefix: '_test_',
        type: 'sessionStorage',
        autoRemove: false,
        migrations: []
      })

      const value = storage.get()
      expect(value).toBeNull()

      const sessionStorageValue = sessionStorage.getItem(sessionStorageKey)
      // old data still exist
      expect(sessionStorageValue).toBe(currentRawValue)
    })

    test('should remove old data if there is no available migrations by default', () => {
      const sessionStorageKey = '_test_user'

      const oldValue = {
        version: 3,
        value: 1024
      }

      sessionStorage.setItem(sessionStorageKey, JSON.stringify(oldValue))

      const storage = create<{
        user: {
          name: string
        }
      }>({
        key: 'user',
        version: 5,
        prefix: '_test_',
        type: 'sessionStorage',
        migrations: [
          /**
           * There is not migration for the current version (3)
           */
          {
            version: 4,
            up (value: { user: string }) {
              return {
                user: {
                  name: value.user
                }
              }
            }
          }
        ]
      })

      const value = storage.get()
      expect(value).toBeNull()

      const sessionStorageValue = sessionStorage.getItem(sessionStorageKey)
      // expect that old value has been removed
      expect(sessionStorageValue).toBeNull()
    })

    test('should not remove old data if there is no available migrations and autoRemove is false', () => {
      const sessionStorageKey = '_test_user'

      const oldValue = {
        version: 3,
        value: 1024
      }

      const currentRawValue = JSON.stringify(oldValue)

      sessionStorage.setItem(sessionStorageKey, currentRawValue)

      const storage = create<{
        user: {
          name: string
        }
      }>({
        key: 'user',
        version: 5,
        prefix: '_test_',
        type: 'sessionStorage',
        // disable autoRemove
        autoRemove: false,
        migrations: [
          /**
           * There is not migration for the current version (3)
           */
          {
            version: 4,
            up (value: { user: string }) {
              return {
                user: {
                  name: value.user
                }
              }
            }
          }
        ]
      })

      const value = storage.get()

      const sessionStorageValue = sessionStorage.getItem(sessionStorageKey)
      // old value still exist
      expect(sessionStorageValue).toBe(currentRawValue)

      // despite old value is still exist in the web storage we return null
      expect(value).toBeNull()
    })

    test('should remove old data if migration failed', () => {
      const sessionStorageKey = '_test_user'

      const oldValue = {
        version: 4,
        value: 1024
      }

      sessionStorage.setItem(sessionStorageKey, JSON.stringify(oldValue))

      const storage = create<{
        user: {
          name: string
        }
      }>({
        key: 'user',
        version: 5,
        prefix: '_test_',
        type: 'sessionStorage',
        migrations: [
          // we have a migration for the current version
          {
            version: 4,
            up (value: {
              // but we expect another data structure
              // so migration throw an error because we try to get non-existent property
              // that makes migration impossible
              expectedObject: {
                expectedProperty1: {
                  expectedProperty2: string
                }
              }
            }) {
              return {
                user: {
                  name: value.expectedObject.expectedProperty1
                    .expectedProperty2
                }
              }
            }
          }
        ]
      })

      const value = storage.get()
      expect(value).toBeNull()

      const sessionStorageValue = sessionStorage.getItem(sessionStorageKey)
      // old data have been removed
      expect(sessionStorageValue).toBeNull()
    })

    test('should not remove old data if migration failed and autoRemove is false', () => {
      const sessionStorageKey = '_test_user'

      const oldValue = {
        version: 4,
        value: 1024
      }

      const currentRawValue = JSON.stringify(oldValue)

      sessionStorage.setItem(sessionStorageKey, currentRawValue)

      const storage = create<{
        user: {
          name: string
        }
      }>({
        key: 'user',
        version: 5,
        prefix: '_test_',
        type: 'sessionStorage',
        autoRemove: false,
        migrations: [
          // we have a migration for the current version
          {
            version: 4,
            up (value: {
              // but we expect another data structure
              // so migration throw an error because we try to get non-existent property
              // that makes migration impossible
              expectedObject: {
                expectedProperty1: {
                  expectedProperty2: string
                }
              }
            }) {
              return {
                user: {
                  name: value.expectedObject.expectedProperty1
                    .expectedProperty2
                }
              }
            }
          }
        ]
      })

      const value = storage.get()
      expect(value).toBeNull()

      const sessionStorageValue = sessionStorage.getItem(sessionStorageKey)
      // old data still exist
      expect(sessionStorageValue).toBe(currentRawValue)
    })

    test("should remove old data if migration's validation failed", () => {
      const sessionStorageKey = '_test_user'

      const oldValue = {
        version: 4,
        value: 'max'
      }

      sessionStorage.setItem(sessionStorageKey, JSON.stringify(oldValue))

      const storage = create<{
        user: {
          name: string
        }
      }>({
        key: 'user',
        version: 5,
        prefix: '_test_',
        type: 'sessionStorage',
        migrations: [
          {
            // migration is available but we expect another data structure
            // so the migration should fail
            version: 4,
            validate (value: {
              expectedObject: {
                expectedProperty1: {
                  expectedProperty2: string
                }
              }
            }) {
              return (
                typeof value.expectedObject.expectedProperty1
                  .expectedProperty2 === 'string'
              )
            },
            // migration function should not be even called because validation failed
            up (value: string) {
              return {
                user: {
                  name: value
                }
              }
            }
          }
        ]
      })

      const value = storage.get()
      expect(value).toBeNull()

      const sessionStorageValue = sessionStorage.getItem(sessionStorageKey)
      // old data have been removed
      expect(sessionStorageValue).toBeNull()
    })

    test("should not remove old data if migration's validation failed and autoRemove is false", () => {
      const sessionStorageKey = '_test_user'

      const oldValue = {
        version: 4,
        value: 'max'
      }

      const currentRawValue = JSON.stringify(oldValue)

      sessionStorage.setItem(sessionStorageKey, currentRawValue)

      const storage = create<{
        user: {
          name: string
        }
      }>({
        key: 'user',
        version: 5,
        prefix: '_test_',
        type: 'sessionStorage',
        autoRemove: false,
        migrations: [
          {
            // migration is available but we expect another data structure
            // so the migration should fail
            version: 4,
            validate (value: {
              expectedObject: {
                expectedProperty1: {
                  expectedProperty2: string
                }
              }
            }) {
              return (
                typeof value.expectedObject.expectedProperty1
                  .expectedProperty2 === 'string'
              )
            },
            // migration function should not be even called because validation failed
            up (value: string) {
              return {
                user: {
                  name: value
                }
              }
            }
          }
        ]
      })

      const value = storage.get()
      expect(value).toBeNull()

      const sessionStorageValue = sessionStorage.getItem(sessionStorageKey)
      // old data still exist
      expect(sessionStorageValue).toBe('{"version":4,"value":"max"}')
    })

    test('should remove old data if migrations is successful but validation failed', () => {
      const sessionStorageKey = '_test_user'

      const oldValue = {
        version: 3,
        value: 'max'
      }

      const currentStringValue = JSON.stringify(oldValue)

      sessionStorage.setItem(sessionStorageKey, currentStringValue)

      const storage = create<{
        user: {
          name: string
        }
      }>({
        key: 'user',
        version: 5,
        prefix: '_test_',
        type: 'sessionStorage',
        validate (value: {
          user: {
            name: string
            id: number
          }
        }) {
          return (
            // we expect "id" field but it does not exist in the result of migation
            typeof value.user.id === 'number' &&
            typeof value.user.name === 'string'
          )
        },
        migrations: [
          {
            version: 3,
            // validation is succesfull
            validate (value: string) {
              return typeof value === 'string'
            },
            // migration is succesfull
            up (value: string) {
              return {
                user: value
              }
            }
          },
          {
            version: 4,
            // validation is succesfull
            validate (value: { user: string }) {
              return typeof value.user === 'string'
            },
            // migration is succesfull
            up (value: { user: string }) {
              return {
                user: {
                  name: value.user
                }
              }
            }
          }
        ]
      })

      const value = storage.get()
      expect(value).toBeNull()

      const sessionStorageValue = sessionStorage.getItem(sessionStorageKey)
      expect(sessionStorageValue).toBeNull()
    })

    test('should not remove old data if migrations is successful but validation failed and autoRemove is false', () => {
      const sessionStorageKey = '_test_user'

      const oldValue = {
        version: 3,
        value: 'max'
      }

      const currentStringValue = JSON.stringify(oldValue)

      sessionStorage.setItem(sessionStorageKey, currentStringValue)

      const storage = create<{
        user: {
          name: string
        }
      }>({
        key: 'user',
        version: 5,
        prefix: '_test_',
        type: 'sessionStorage',
        autoRemove: false,
        validate (value: {
          user: {
            name: string
            id: number
          }
        }) {
          return (
            // we expect "id" field but it does not exist in the result of migation
            typeof value.user.id === 'number' &&
            typeof value.user.name === 'string'
          )
        },
        migrations: [
          {
            version: 3,
            // validation is succesfull
            validate (value: string) {
              return typeof value === 'string'
            },
            // migration is succesfull
            up (value: string) {
              return {
                user: value
              }
            }
          },
          {
            version: 4,
            // validation is succesfull
            validate (value: { user: string }) {
              return typeof value.user === 'string'
            },
            // migration is succesfull
            up (value: { user: string }) {
              return {
                user: {
                  name: value.user
                }
              }
            }
          }
        ]
      })

      const value = storage.get()
      expect(value).toBeNull()

      const sessionStorageValue = sessionStorage.getItem(sessionStorageKey)
      expect(sessionStorageValue).toBe('{"version":3,"value":"max"}')
    })

    test('should migrate data, update it and return it', () => {
      const sessionStorageKey = '_test_user'

      const oldValue = {
        version: 3,
        value: 'max'
      }

      const currentStringValue = JSON.stringify(oldValue)

      sessionStorage.setItem(sessionStorageKey, currentStringValue)

      const storage = create<{
        user: {
          name: string
        }
      }>({
        key: 'user',
        version: 5,
        prefix: '_test_',
        type: 'sessionStorage',
        validate (value: {
          user: {
            name: string
            id: number
          }
        }) {
          return (
            // we expect "id" field but it does not exist in the result of migation
            typeof value.user.id === 'number' &&
            typeof value.user.name === 'string'
          )
        },
        migrations: [
          {
            version: 3,
            // validation is succesfull
            validate (value: string) {
              return typeof value === 'string'
            },
            // migration is succesfull
            up (value: string) {
              return {
                user: value
              }
            }
          },
          {
            version: 4,
            // validation is succesfull
            validate (value: { user: string }) {
              return typeof value.user === 'string'
            },
            // migration is succesfull
            up (value: { user: string }) {
              return {
                user: {
                  name: value.user,
                  id: 500
                }
              }
            }
          }
        ]
      })

      const value = storage.get()
      expect(value).toEqual({
        user: {
          name: 'max',
          id: 500
        }
      })

      const sessionStorageValue = sessionStorage.getItem(sessionStorageKey)
      expect(sessionStorageValue).toBe(
        '{"version":5,"value":{"user":{"name":"max","id":500}}}'
      )
    })

    test('should migrate data, update it and return it (1 migration)', () => {
      const sessionStorageKey = '_test_user'

      const oldValue = {
        version: 4,
        value: {
          user: 'max'
        }
      }

      const currentStringValue = JSON.stringify(oldValue)

      sessionStorage.setItem(sessionStorageKey, currentStringValue)

      const storage = create<{
        user: {
          name: string
        }
      }>({
        key: 'user',
        version: 5,
        prefix: '_test_',
        type: 'sessionStorage',
        validate (value: {
          user: {
            name: string
            id: number
          }
        }) {
          return (
            // we expect "id" field but it does not exist in the result of migation
            typeof value.user.id === 'number' &&
            typeof value.user.name === 'string'
          )
        },
        migrations: [
          {
            version: 4,
            // validation is succesfull
            validate (value: { user: string }) {
              return typeof value.user === 'string'
            },
            // migration is succesfull
            up (value: { user: string }) {
              return {
                user: {
                  name: value.user,
                  id: 500
                }
              }
            }
          }
        ]
      })

      const value = storage.get()
      expect(value).toEqual({
        user: {
          name: 'max',
          id: 500
        }
      })

      const sessionStorageValue = sessionStorage.getItem(sessionStorageKey)
      expect(sessionStorageValue).toBe(
        '{"version":5,"value":{"user":{"name":"max","id":500}}}'
      )
    })
  })
})
