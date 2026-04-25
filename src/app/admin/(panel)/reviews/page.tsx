import { ReviewsListClient } from "@/components/admin/reviews-list-client"
import { getReviews } from "@/lib/queries/reviews"

export default async function ReviewsPage() {
  const reviews = await getReviews({ limit: 200 })
  return <ReviewsListClient initialReviews={reviews} />
}
