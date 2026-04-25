import { notFound } from "next/navigation"
import { ProductForm } from "@/components/admin/product-form"
import { getProduct } from "@/lib/queries/products"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params
  const product = await getProduct(id)
  if (!product) notFound()
  return <ProductForm mode="edit" product={product} />
}
