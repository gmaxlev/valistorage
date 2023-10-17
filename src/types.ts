export type Version = number

export interface VstorageData {
  version: Version
  value: unknown
}

export type Validator = (value: any) => boolean

export interface Migration {
  version: Version
  up: (value: any) => unknown
  validate?: Validator
}
