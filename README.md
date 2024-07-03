# valistorage

A library for efficiently managing data in `localStorage` and `sessionStorage` using **versioning** and **migrations**.

# Installation

```bash
npm install valistorage
```

## Creating Storage

To start working with a value, you need to use `create` function.

TypeScript allows us to describe the structure of the data we want to store using types.


```ts
import { create } from 'valistorage';

interface CatVersion1 {
    name: string;
    age: number;
}

export const catLocalStorage = create<CatVersion1>({
    key: 'cat',
    version: 1,
});
```

Let's look at the two required parameters that we passed:

- `key` - a unique key under which the data will be stored
- `version` - the version of the data

## Choosing Storage

By default, valistorage uses `localStorage` to store data.
You can specify the type of storage by providing `type` parameter in `create` function, which accepts either `localStorage` or `sessionStorage`.

```ts

export const catSessionStorage = create({
    key: 'cat',
    version: 1,
    type: 'sessionStorage',
});
```

## Saving

To add or update data, use `set` method of the object created with `create` function.

```ts
catLocalStorage.set({
    name: 'Tom',
    age: 7,
});

```

## Getting

To retrieve data, use `get` method of the object created with `create` function.

```ts
const cat = catLocalStorage.get();

if (cat) {
    console.log(cat.name); // Tom
    console.log(cat.age); // 7
}
```

## Deletion

To delete data, use `remove` method of the object created with `create` function.

```ts
catLocalStorage.remove();
```

## Changing Data Structure

Imagine that we've decided to add a `color` field to our data structure. Users who have already used the application will only have `name` and `age` stored, so the application won't be able to retrieve `color`.

```ts
import { create } from 'valistorage';

interface CatVersion1 {
    name: string;
    age: number;
}

interface CatVersion2 {
    name: string;
    age: number;
    color: string;
}

export const catLocalStorage = create<CatVersion2>({
    key: 'cat',
    version: 2,
});
```

We've just indicated that we're going to store a different data structure in this key and incremented the version by one - from `1` to `2`.

> Note that the version number must be a number. The new version should be incremented by 1 relative to the previous version.

What will happen if the user uses the app now?

```ts
const cat = catLocalStorage.get();
```

If the user already has data with version `1`, it will be deleted, and `get` will return `null` because there are no migrations found to convert data from version `1` to version `2`.

Returning the old data would be incorrect because it does not correspond to the new data structure.

## Migrations

To ensure the best user experience, we can automatically convert their data to a new format using migrations.

Let's add migrations to our `storage`.

```ts
import { create } from 'valistorage';

interface CatVersion1 {
    name: string;
    age: number;
}

interface CatVersion2 {
    name: string;
    age: number;
    color: string;
}

const version1ToVersion2 = {
    version: 1,
    up: (value: CatVersion1): CatVersion2 => {
        return {
            name: value.name,
            age: value.age,
            color: 'grey',
        };
    },
}

export const catLocalStorage = create<CatVersion2>({
    key: 'cat',
    version: 2,
    migrations: [
        version1ToVersion2
    ]
});
```

Migrations are an array of objects, each containing two properties:
- `version`: the data version we want to transform
- `up`: a function that converts data from one version to another

Now, if the user uses the application, their data will be automatically converted to the new format (with the `color` field added).
We don't need to call migrations explicitly; they will be triggered automatically when retrieving data.
We can simply get this data:

```ts
const cat = catLocalStorage.get();

if (cat) {
    console.log(cat.name); // Tom
    console.log(cat.age); // 7
    console.log(cat.color); // grey (new field, added by migration)
}


```

## Validation

Please note that until now, we haven't verified that the data we receive matches our described data structure in TypeScript.

Unfortunately, in reality, everything is prone to errors:

- We might save incorrect data in localStorage.
- TypeScript doesn't work at runtime, so we can't rely on its types.
- We could make mistakes in migrations.

Fortunately, the library offers a flexible data validation mechanism.

Usually, various libraries are used for runtime validation, such as `yup`, `zod`, `joi`, `valibot`, etc.
You are not limited to choosing a specific library; you can also write your own validators without using any libraries.

For validating data in storage and migrations, `validate` parameter is used.

Let's add validation to our previous data structure:

```ts
import { create } from 'valistorage';
import * as yup from 'yup';

// Define data structures

const catSchemaVersion1 = yup.object().shape({
    name: yup.string().required(),
    age: yup.number().required(),
});

type CateSchemaVersion1 = yup.InferType<typeof catSchemaVersion1>;

const catSchemaVersion2 = yup.object().shape({
    name: yup.string().required(),
    age: yup.number().required(),
    color: yup.string().required(),
});

type CateSchemaVersion2 = yup.InferType<typeof catSchemaVersion2>;

// Define migrations
const version1ToVersion2 = {
    version: 1,
    validate(value: unknown): value is CateSchemaVersion1 {
        return catSchemaVersion1.isValidSync(value);
    },
    up: (value: CateSchemaVersion1): CateSchemaVersion2 => {
        return {
            name: value.name,
            age: value.age,
            color: 'grey',
        };
    },
}

export const catLocalStorage = create<CateSchemaVersion2>({
    key: 'cat',
    version: 2,
    validate(value: unknown): value is CateSchemaVersion2 {
        return catSchemaVersion2.isValidSync(value);
    },
    migrations: [
        version1ToVersion2
    ]
});
```

## Remove All Data

To remove all values that are stored by the library, use  `removeAll` method.

```ts
import { removeAll } from 'valistorage';

removeAll();
````

> Note that `removeAll` is not the same as `clear` method of `localStorage` or `sessionStorage`. It removes only values that are stored by the library.

## autoRemove

By default, if no migrations are found for the data or if the data fails validation, it will be deleted.
You can change this behavior by using the `autoRemove` parameter, which allows old data to be kept until it is converted to the new format or replaced with new data.

```ts
import { create } from 'valistorage';

export const catLocalStorage = create({
    key: 'cat',
    version: 1,
    autoRemove: false,
});
```

## License

[MIT](LICENSE)
