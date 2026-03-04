import ContentCard from "@/components/common/ContentCard";
import { Content } from "@/types/content";

export default function ContentRow({ title, items }: { title: string; items: Content[] }) {
  if (!items.length) return null;

  return (
    <section className="space-y-3">
      <h2 className="section-title text-xl text-white md:text-2xl">{title}</h2>
      <div className="scrollbar-thin snap-x snap-mandatory flex gap-3 overflow-x-auto px-1 py-4 scroll-smooth">
        {items.map((item, index) => (
          <div key={item._id ?? `${item.type}-${item.slug}-${item.year}-${index}`} className="snap-start">
            <ContentCard item={item} />
          </div>
        ))}
      </div>
    </section>
  );
}
