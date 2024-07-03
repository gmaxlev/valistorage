import { type ValistorageData } from '../types'
import { IS_DEV, warn } from '../utils'

function isValistorageValue (
  value: unknown,
  verbose: boolean
): value is ValistorageData {
  const isValid =
    typeof value === 'object' &&
    value !== null &&
    'version' in value &&
    typeof value.version === 'number' &&
    'value' in value

  if (!isValid && verbose && IS_DEV) {
    warn(
      'It seems like the library tries to get data that does not belong to it.\bPlease do not use library data directly.'
    )
  }

  return isValid
}

export function unpack (value: string, verbose: boolean): ValistorageData | null {
  try {
    const parsed = JSON.parse(value) as unknown
    if (!isValistorageValue(parsed, verbose)) {
      return null
    }
    return parsed
  } catch (e) {
    return null
  }
}

export function pack (version: number, value: unknown): string | null {
  try {
    const packed = {
      version,
      value
    }

    return JSON.stringify(packed)
  } catch (e) {
    return null
  }
}
