import { Tag } from "lucide-react"
import { PageStub } from "@/components/admin/page-stub"

export default function CategoriesPage() {
  return (
    <PageStub
      title="Categorías"
      description="Crea y organiza colecciones (NBA, fútbol, retro, niños, lo que quieras)."
      icon={Tag}
      todo={[
        "Crear categorías y subcategorías sin límite de profundidad",
        "Reordenar arrastrando (drag & drop)",
        "Asignar productos a múltiples categorías",
        "Configurar imagen, descripción y SEO por categoría",
        "Mostrar/ocultar categorías sin borrarlas",
      ]}
    />
  )
}
