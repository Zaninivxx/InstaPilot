export default function BrandMark({ size = 34 }: { size?: number }) {
  return (
    <div
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        background: 'linear-gradient(135deg, #ff7a18 0%, #ff477e 52%, #7c4dff 100%)',
        position: 'relative',
        boxShadow: '0 10px 26px rgba(124,77,255,.18), 0 6px 16px rgba(255,71,126,.18)'
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: '22%',
          borderRadius: size * 0.18,
          border: '2px solid rgba(255,255,255,.95)'
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: size * 0.13,
          height: size * 0.13,
          borderRadius: '50%',
          background: '#fff',
          right: size * 0.22,
          top: size * 0.22
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: size * 0.26,
          height: size * 0.26,
          borderRadius: '50%',
          border: '2px solid rgba(255,255,255,.95)',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      />
    </div>
  );
}
