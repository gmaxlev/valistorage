export function warn(message: string) {
  console.warn(`[vstorage]\n\n${message}`);
}

export const IS_DEV = process.env["NODE_ENV"] !== "DEVELOPMENT";
