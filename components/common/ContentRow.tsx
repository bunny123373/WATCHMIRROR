import ContentCard from "@/components/common/ContentCard";
import { Content } from "@/types/content";

export default function ContentRow({ title, items }: { title: string; items: Content[] }) {
  if (!items.length) return null;

  return (
    <section className="space-y-3">
      <h2 className="font-[var(--font-heading)] text-2xl tracking-wide text-white">{title}</h2>
      <div className="scrollbar-thin flex gap-3 overflow-x-auto px-1 py-5">
        {items.map((item, index) => (
          <ContentCard key={item._id ?? `${item.type}-${item.slug}-${item.year}-${index}`} item={item} />
        ))}
      </div>
    </section>
  );
}
