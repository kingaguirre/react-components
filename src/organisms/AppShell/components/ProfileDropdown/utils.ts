export const formatDate = (value) => {
  // Create a Date object from the input value
  const date = new Date(value)

  // Validate the date
  if (isNaN(date.getTime())) {
    return "Invalid Date"
  }

  // Check if time information exists (non-zero hours, minutes, or seconds)
  const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0 || date.getSeconds() !== 0

  if (hasTime) {
    // Format date and time as "DD-MM-YYYY HH:mm:ss" with leading zeros where necessary
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0') // Months are zero-indexed
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')

    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`
  } else {
    // Format date only as "DD-MMM-YYYY" with abbreviated month
    const day = date.getDate()
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const month = monthNames[date.getMonth()]
    const year = date.getFullYear()

    return `${day}-${month}-${year}`
  }
}