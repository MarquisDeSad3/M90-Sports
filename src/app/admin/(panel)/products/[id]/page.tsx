import { notFound } from "next/navigation"
import { ProductForm } from "@/components/admin/product-form"
import { mockProducts } from "@/lib/mock-data"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params
  const product = mockProducts.find((p) => p.id === id)
  if (!product) notFound()
  return <ProductForm mode="edit" product={product} />
}
