import { getCategoria } from "@/lib/categorias";

export function CategoryBadge({ id, className = "" }: { id: string; className?: string }) {
  const cat = getCategoria(id);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${className}`}
      style={{
        color: cat.color,
        borderColor: `${cat.color}55`,
        backgroundColor: `${cat.color}18`,
      }}
    >
      <span aria-hidden>{cat.emoji}</span>
      {cat.nombre}
    </span>
  );
}
