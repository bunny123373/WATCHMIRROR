import { redirect } from "next/navigation";

export default function AddSeriesPage() {
  redirect("/admin?mode=series");
}
