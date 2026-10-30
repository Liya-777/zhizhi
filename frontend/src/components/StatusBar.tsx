export default function StatusBar() {
  return (
    <footer
      className="border-t px-4 py-1 flex items-center justify-between"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
    >
      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Design by zzy</span>
      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>v1.0.0-beta</span>
    </footer>
  );
}
