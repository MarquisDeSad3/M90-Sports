import { OrdersListClient } from "@/components/admin/orders-list-client"
import { getOrders, getOrderCounts } from "@/lib/queries/orders"

export default async function OrdersPage() {
  const [orders, counts] = await Promise.all([
    getOrders({ limit: 100 }),
    getOrderCounts(),
  ])

  return <OrdersListClient orders={orders} counts={counts} />
}
