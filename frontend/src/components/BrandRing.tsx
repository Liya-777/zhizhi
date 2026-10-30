/** Breathing metal ring brand mark for the login page.
 *  Four concentric rings with staggered animation create a machined-metal depth illusion.
 *  Extracted from LoginPage to isolate the animation complexity. */
export default function BrandRing() {
  return (
    <div className="relative mx-auto mb-5" style={{ width: '100px', height: '100px' }}>
      {/* 1. Ambient glow halo */}
      <div
        className="absolute rounded-full"
        style={{
          width: '64px', height: '64px', margin: '18px',
          background: 'transparent',
          boxShadow: '0 0 6px 2px oklch(0.55 0 0 / 0.14)',
          filter: 'blur(4px)', opacity: 0.5,
          animation: 'haloBreath 3.2s ease-in-out infinite',
        }}
      />
      {/* 2. Main gradient ring — the visual anchor */}
      <div
        className="absolute rounded-full"
        style={{
          width: '64px', height: '64px', margin: '18px',
          border: '2.5px solid oklch(0.55 0 0)',
          background: 'radial-gradient(circle, transparent 24px, oklch(0.60 0 0) 26px, oklch(0.42 0 0) 32px, oklch(0.25 0 0) 34px, transparent 36px)',
          boxShadow: '0 8px 24px oklch(0 0 0 / 0.16), inset 0 1.5px 0 oklch(1.0 0 0 / 0.22)',
          animation: 'ringBreathFull 3.2s ease-in-out infinite',
        }}
      />
      {/* 3. Inner ring — staggered delay for depth */}
      <div
        className="absolute rounded-full"
        style={{
          width: '44px', height: '44px', margin: '28px',
          border: '2px solid oklch(0.48 0 0)',
          boxShadow: '0 3px 10px oklch(0 0 0 / 0.08)',
          animation: 'ringBreathFull 3.2s ease-in-out infinite 0.6s',
        }}
      />
      {/* 4. Surface highlight — metallic sheen at 38% from top-left */}
      <div
        className="absolute rounded-full"
        style={{
          width: '64px', height: '64px', margin: '18px',
          background: 'radial-gradient(circle at 38% 30%, oklch(1.0 0 0 / 0.12) 0%, transparent 50%)',
          pointerEvents: 'none',
          animation: 'ringBreathFull 3.2s ease-in-out infinite',
        }}
      />
    </div>
  );
}
