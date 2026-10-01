export default function PersonAvatar({ initials, size = 34, solid = false }: { initials: string; size?: number; solid?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full font-bold ${
        solid ? "bg-brand text-white" : "bg-blue-100 text-brand"
      }`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.34) }}
    >
      {initials}
    </div>
  );
}
