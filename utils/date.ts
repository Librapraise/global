export const formatDateTime = (date: string, time?: string): string => {
  try {
    const dateObj = new Date(date)
    const formattedDate = dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })

    if (time) {
      return `${formattedDate} at ${time}`
    }

    return formattedDate
  } catch (error) {
    console.error("Error formatting date:", error)
    return date
  }
}

export const getDaysSince = (dateString: string | null | undefined): number => {
  if (!dateString) return Number.POSITIVE_INFINITY
  const date = new Date(dateString)
  const today = new Date()
  const diffTime = Math.abs(today.getTime() - date.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export const formatRelativeTime = (dateString: string | null | undefined): string => {
  if (!dateString) return "Never"

  const days = getDaysSince(dateString)

  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  if (days < 365) return `${Math.floor(days / 30)} months ago`

  return `${Math.floor(days / 365)} years ago`
}
