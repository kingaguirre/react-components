export const ifElse = <T,>(condition: boolean, trueValue: T, falseValue: T): T => {
  if (condition) {
    return trueValue;
  }
  return falseValue;
};
