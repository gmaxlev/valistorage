import {DEFAULT_PREFIX} from "../constants.ts";

interface Options {
    type?: "localeStorage" | "sessionStorage";
    prefix?: string;
}

function getKeys(storage: Storage, prefix: string) {

    const keys: string[] = [];

    for (let i = 0; i < storage.length; i++){

        const key = storage.key(i)

        if (!key) {
            continue;
        }

        if (!key.startsWith(prefix)) {
            continue;
        }

       keys.push(key)
    }

    return keys
}

export function removeAll(options?: Options) {
    const type = options?.type || 'localeStorage'
    const prefix = options?.prefix || DEFAULT_PREFIX

    const storage = type === 'localeStorage' ? window.localStorage : window.sessionStorage;

    const keys = getKeys(storage, prefix);

    keys.forEach(key => {
        storage.removeItem(key)
    })

}
