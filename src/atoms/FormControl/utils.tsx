export const getInvalidForCustomGroupControl = (updatedValues: any[], required: boolean) => {
  const isValid = updatedValues.length > 0;
  return required && !isValid;
};
