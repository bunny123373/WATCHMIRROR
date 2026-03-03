import ContentCard from "@/components/common/ContentCard";
import { Content } from "@/types/content";

export default function ContentRow({ title, items }: { title: string; items: Content[] }) {
  if (!items.length) return null;

  return (
    <section className="space-y-4">
      <h2 className="font-[var(--font-heading)] text-2xl tracking-wide">{title}</h2>
      <div className="scrollbar-thin flex gap-4 overflow-x-auto pb-2">
        {items.map((item, index) => (
          <ContentCard key={item._id ?? `${item.type}-${item.slug}-${item.year}-${index}`} item={item} />
        ))}
      </div>
    </section>
  );
}
