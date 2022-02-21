import * as bson from "bson";

export type Codec<T> = {
  encode: (data: T) => Buffer | string;
  decode: (data: Buffer | string) => T;
};

export const createBSONCodec = <T>(validator: (data: T) => true): Codec<T> => {
  return {
    decode: (data) => {
      const event = bson.deserialize(Buffer.from(data), {
        promoteBuffers: true,
        validation: {
          utf8: false
        }
      });
      validator(event as any);
      return event as T;
    },
    encode: (data) => {
      validator(data);
      return bson.serialize(data);
    }
  };
};
