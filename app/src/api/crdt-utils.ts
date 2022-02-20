import * as y from "yjs";

export const stateVectorsAreEqual = (left: Uint8Array, right: Uint8Array): boolean => {
  const left_vector = y.decodeStateVector(left);
  const right_vector = y.decodeStateVector(right);

  if (left_vector.size !== right_vector.size) {
    return false;
  }

  for (const [key, value] of left_vector) {
    if (right_vector.get(key) !== value) {
      return false;
    }
  }

  return true;
};
