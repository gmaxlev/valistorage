import { describe, expect, test, afterEach } from 'vitest'
import { create } from './create.ts'
import { removeAll } from './removeAll.ts'

describe('removeAll()', () => {
  afterEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  test('should remove all items', () => {
    const api = create<string>({
      key: 'test',
      version: 1
    })

    api.set('Hello World!')

    expect(api.get()).toBe('Hello World!')

    removeAll()

    expect(api.get()).toBe(null)
  })

  test('should remove all items of specified storage', () => {
    const api = create<string>({
      key: 'test',
      version: 1,
      type: 'sessionStorage'
    })

    api.set('Foo')

    expect(api.get()).toBe('Foo')

    removeAll({
      type: 'localStorage'
    })

    expect(api.get()).toBe('Foo')
  })

  test('should not affect values not related to the library', () => {
    localStorage.setItem('foo', '1')
    sessionStorage.setItem('bar', '2')

    const api = create<string>({
      key: 'test',
      version: 1,
      type: 'sessionStorage'
    })

    api.set('Hello World!')

    expect(api.get()).toBe('Hello World!')

    removeAll({
      type: 'sessionStorage'
    })

    expect(api.get()).toBe(null)

    expect(localStorage.getItem('foo'), '1')
    expect(localStorage.getItem('bar'), '2')
  })

  test('should remove all items with specified prefix', () => {
    localStorage.setItem('foo', '1')
    sessionStorage.setItem('bar', '2')

    const api1 = create<string>({
      key: 'test',
      version: 1,
      type: 'sessionStorage',
      prefix: 'my_prefix_one'
    })

    const api2 = create<string>({
      key: 'test',
      version: 1,
      type: 'sessionStorage',
      prefix: 'my_prefix_two'
    })

    api1.set('Hello World!')
    api2.set('Bonjour')

    expect(api1.get()).toBe('Hello World!')

    removeAll({
      type: 'sessionStorage',
      prefix: 'my_prefix_one'
    })

    expect(api1.get()).toBe(null)
    expect(api2.get()).toBe('Bonjour')

    expect(localStorage.getItem('foo'), '1')
    expect(localStorage.getItem('bar'), '2')
  })
})
