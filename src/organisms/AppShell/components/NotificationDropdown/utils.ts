
// Optimized timeAgo function
export const timeAgo = (date) => {
  const now = Date.now()
  const past = new Date(date).getTime()
  const diff = now - past

  // Pre-calculate milliseconds per time unit
  const MS_PER_SECOND = 1000
  const MS_PER_MINUTE = 60 * MS_PER_SECOND
  const MS_PER_HOUR = 60 * MS_PER_MINUTE
  const MS_PER_DAY = 24 * MS_PER_HOUR
  const MS_PER_WEEK = 7 * MS_PER_DAY
  const MS_PER_MONTH = 30 * MS_PER_DAY // approximate month
  const MS_PER_YEAR = 365 * MS_PER_DAY

  if (diff < MS_PER_MINUTE) {
    return 'just now'
  } else if (diff < MS_PER_HOUR) {
    const minutes = Math.floor(diff / MS_PER_MINUTE)
    return minutes + ' minute' + (minutes > 1 ? 's' : '') + ' ago'
  } else if (diff < MS_PER_DAY) {
    const hours = Math.floor(diff / MS_PER_HOUR)
    return hours + ' hour' + (hours > 1 ? 's' : '') + ' ago'
  } else if (diff < MS_PER_WEEK) {
    const days = Math.floor(diff / MS_PER_DAY)
    return days + ' day' + (days > 1 ? 's' : '') + ' ago'
  } else if (diff < MS_PER_MONTH) {
    const weeks = Math.floor(diff / MS_PER_WEEK)
    return weeks + ' week' + (weeks > 1 ? 's' : '') + ' ago'
  } else if (diff < MS_PER_YEAR) {
    const months = Math.floor(diff / MS_PER_MONTH)
    return months + ' month' + (months > 1 ? 's' : '') + ' ago'
  } else {
    const years = Math.floor(diff / MS_PER_YEAR)
    return years + ' year' + (years > 1 ? 's' : '') + ' ago'
  }
}