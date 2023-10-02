export type Version = number;

export type VstorageData = {
  version: Version;
  value: unknown;
};

export type Validator = (value: any) => boolean;

export type Migration = {
  version: Version;
  up: (value: any) => unknown;
  validate?: Validator;
};
