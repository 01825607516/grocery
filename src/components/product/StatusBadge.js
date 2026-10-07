import { STATUS_LABEL } from "@/lib/data";

const style = { fresh: "bg-primary-light text-primary", low: "bg-amber-100 text-amber-800", near: "bg-orange-100 text-orange-800", out: "bg-gray-200 text-gray-600" };

export default function StatusBadge({ status }) {
  if (!status) return null;
  return <span className={`w-fit block rounded-full px-2 py-0.5 text-[11px] font-medium ${style[status]}`}>{STATUS_LABEL[status]}</span>;
}
