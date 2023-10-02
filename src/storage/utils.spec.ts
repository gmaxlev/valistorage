import { describe, test, expect } from "vitest";
import { pack, unpack } from "./utils";

describe("utils", () => {
  describe("unpack", () => {
    test("should return null if unpacking failed", () => {
      const result1 = unpack(JSON.stringify(null), false);
      expect(result1).toBe(null);

      const result2 = unpack(JSON.stringify({}), false);
      expect(result2).toBe(null);

      const result3 = unpack(
        JSON.stringify({
          version: "1",
          value: {},
        }),
        false
      );
      expect(result3).toBe(null);

      const result4 = unpack(
        JSON.stringify({
          version: 1,
        }),
        false
      );
      expect(result4).toBe(null);

      const result5 = unpack("_not_valid_json", false);
      expect(result5).toBe(null);
    });

    test("should return value if unpacking is success", () => {
      const result1 = unpack(
        JSON.stringify({
          version: 3,
          value: null,
        }),
        false
      );
      expect(result1).toEqual({
        version: 3,
        value: null,
      });

      const result2 = unpack(
        JSON.stringify({
          version: 1,
          value: {
            foo: "bar",
          },
        }),
        false
      );
      expect(result2).toEqual({
        version: 1,
        value: {
          foo: "bar",
        },
      });
    });
  });
  describe("pack", () => {
    test("should return null if packing failed", () => {
      const obj: any = {};
      obj.circularReference = obj;

      const result = pack(5, obj);

      expect(result).toBeNull();
    });
    test("should return JSON if packing is success", () => {
      const result = pack(5, {
        foo: "bar",
      });

      expect(result).toEqual('{"version":5,"value":{"foo":"bar"}}');
    });
  });
});
