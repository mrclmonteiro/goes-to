const N = 12

export default function Spinner({ size = 32 }: { size?: number }) {
  const bar = size * 0.09
  const len = size * 0.27
  const inner = size * 0.22

  return (
    <div style={{ width: size, height: size, position: 'relative' }}>
      <style>{`
        @keyframes apple-bar-fade {
          0%   { opacity: 1; }
          100% { opacity: 0.12; }
        }
      `}</style>
      {Array.from({ length: N }).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: bar,
            height: len,
            marginLeft: -bar / 2,
            marginTop: -(inner + len),
            borderRadius: bar / 2,
            background: 'white',
            transform: `rotate(${i * (360 / N)}deg) translateY(0)`,
            transformOrigin: `50% calc(100% + ${inner}px)`,
            animation: `apple-bar-fade ${N * 0.075}s linear infinite`,
            animationDelay: `${-(N - i) * 0.075}s`,
          }}
        />
      ))}
    </div>
  )
}
