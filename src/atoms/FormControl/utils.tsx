export const getInvalidForCustomGroupControl = (updatedValues: unknown[], required: boolean) => {
  const isValid = updatedValues.length > 0
  return required && !isValid
}

// Utility to merge multiple refs
export const mergeRefs = (...refs) => (node) => {
  refs.forEach(ref => {
    if (typeof ref === 'function') {
      ref(node)
    } else if (ref) {
      ref.current = node
    }
  })
}