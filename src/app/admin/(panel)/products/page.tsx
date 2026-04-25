import { Package } from "lucide-react"
import { PageStub } from "@/components/admin/page-stub"

export default function ProductsPage() {
  return (
    <PageStub
      title="Productos"
      description="Jerseys, gorras, conjuntos y todo el catálogo M90."
      icon={Package}
      todo={[
        "Crear, editar y archivar productos",
        "Subir múltiples imágenes por producto y variante",
        "Gestionar variantes (talla, versión local/visitante/retro)",
        "Controlar stock por variante y alertas de stock crítico",
        "Configurar pre-orders con fecha estimada de llegada",
      ]}
    />
  )
}
