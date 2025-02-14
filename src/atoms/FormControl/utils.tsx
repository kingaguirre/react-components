export const getInvalidForCustomGroupControl = (updatedValues: unknown[], required: boolean) => {
  const isValid = updatedValues.length > 0;
  return required && !isValid;
};
