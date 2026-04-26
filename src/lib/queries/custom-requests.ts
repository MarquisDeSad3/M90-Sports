import "server-only"
import { desc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { customRequests } from "@/lib/db/schema"

export type CustomRequestStatus =
  | "pending"
  | "quoted"
  | "accepted"
  | "rejected"
  | "converted"

export interface CustomRequest {
  id: string
  customerName: string
  customerPhone: string
  customerEmail: string | null
  requestText: string
  referenceImages: string[] | null
  referenceLinks: string[] | null
  desiredSize: string | null
  desiredQuantity: number
  status: CustomRequestStatus
  quotedPrice: number | null
  quoteNotes: string | null
  quotedAt: Date | null
  convertedOrderId: string | null
  adminNotes: string | null
  createdAt: Date
  updatedAt: Date
}

export async function getCustomRequests(): Promise<CustomRequest[]> {
  try {
    const rows = await db
      .select()
      .from(customRequests)
      .orderBy(desc(customRequests.createdAt))

    return rows.map((r) => ({
      id: r.id,
      customerName: r.customerName,
      customerPhone: r.customerPhone,
      customerEmail: r.customerEmail ?? null,
      requestText: r.requestText,
      referenceImages: (r.referenceImages as string[] | null) ?? null,
      referenceLinks: (r.referenceLinks as string[] | null) ?? null,
      desiredSize: r.desiredSize ?? null,
      desiredQuantity: r.desiredQuantity,
      status: r.status as CustomRequestStatus,
      quotedPrice: r.quotedPrice ? Number(r.quotedPrice) : null,
      quoteNotes: r.quoteNotes ?? null,
      quotedAt: r.quotedAt ?? null,
      convertedOrderId: r.convertedOrderId ?? null,
      adminNotes: r.adminNotes ?? null,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }))
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[custom-requests] DB unavailable in dev:", err)
      return []
    }
    throw err
  }
}

export async function getCustomRequestCounts() {
  try {
    const all = await db.select().from(customRequests)
    const by = (s: CustomRequestStatus) => all.filter((r) => r.status === s).length
    return {
      total: all.length,
      pending: by("pending"),
      quoted: by("quoted"),
      accepted: by("accepted"),
      rejected: by("rejected"),
      converted: by("converted"),
    }
  } catch {
    return { total: 0, pending: 0, quoted: 0, accepted: 0, rejected: 0, converted: 0 }
  }
}
