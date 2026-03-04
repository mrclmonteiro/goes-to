// EasterEgg.tsx — drop-in component para os easter eggs de avatar
// O avatar está centrado horizontalmente, com o topo em ~100px e 125px de diâmetro.
// Avatar center Y ≈ 162px, center X = 50vw.

'use client'

export type EggType = 'lion' | 'up' | '007' | 'batman' | 'paris' | 'clube' | 'titanic' | 'chefao' | null

// Avatar metrics (match your page layout)
const AV_TOP = 100   // marginTop do container do avatar
const AV_SIZE = 125  // diâmetro
const AV_CY = AV_TOP + AV_SIZE / 2  // ~162px — centro vertical do avatar
const AV_R  = AV_SIZE / 2           // ~62px  — raio

// helper: inline keyframes via <style> injected once per egg
function EggStyle({ css }: { css: string }) {
  return <style>{css}</style>
}

// ─── Emoji posicionado absolutamente ─────────────────────────────────────────
function Emoji({
  children, style, className,
}: {
  children: string
  style?: React.CSSProperties
  className?: string
}) {
  return (
    <span
      className={className}
      style={{
        position: 'fixed',
        userSelect: 'none',
        lineHeight: 1,
        ...style,
      }}
    >
      {children}
    </span>
  )
}

// ─── Shared fade wrapper ──────────────────────────────────────────────────────
// Aparece, fica, some. Duração total controlada pelo pai.
const fadeKF = `
  @keyframes eg-fade {
    0%   { opacity:0; transform: scale(0.5); }
    15%  { opacity:1; transform: scale(1.1); }
    25%  { transform: scale(1); }
    75%  { opacity:1; }
    100% { opacity:0; transform: scale(0.85); }
  }
`

function FadeEmoji({
  children, size = 32, top, left, delay = 0, duration = 2.4, style = {},
}: {
  children: string; size?: number
  top: number | string; left: number | string
  delay?: number; duration?: number
  style?: React.CSSProperties
}) {
  return (
    <Emoji style={{
      fontSize: size,
      top,
      left,
      animation: `eg-fade ${duration}s ${delay}s ease-out forwards`,
      opacity: 0,
      ...style,
    }}>
      {children}
    </Emoji>
  )
}

// =============================================================================
//  INDIVIDUAL EGGS
// =============================================================================

// 👑 REI LEÃO — coroa cai e pousa bem em cima do avatar
function EggLion() {
  const crownY = AV_TOP - 16  // cima da cabeça
  return (
    <>
      <EggStyle css={`
        @keyframes eg-crown {
          0%   { transform:translateX(-50%) translateY(-90px) rotate(-15deg); opacity:0; }
          30%  { transform:translateX(-50%) translateY(0)     rotate(5deg);   opacity:1; }
          45%  { transform:translateX(-50%) translateY(-6px)  rotate(-2deg);  }
          55%  { transform:translateX(-50%) translateY(0)     rotate(0deg);   }
          80%  { opacity:1; }
          100% { transform:translateX(-50%) translateY(0);  opacity:0; }
        }
      `} />
      <Emoji style={{
        fontSize: 52,
        top: crownY,
        left: '50%',
        animation: 'eg-crown 3s ease-out forwards',
        opacity: 0,
      }}>👑</Emoji>
    </>
  )
}

// 🎈🏠 UP — balão+casa flutuam de baixo para cima com deriva lateral
function EggUp() {
  return (
    <>
      <EggStyle css={`
        @keyframes eg-up-rise {
          from { transform: translateY(0); }
          to   { transform: translateY(calc(-100vh - 200px)); }
        }
        @keyframes eg-up-sway {
          0%   { transform: translateX(0px); }
          20%  { transform: translateX(18px); }
          40%  { transform: translateX(-14px); }
          60%  { transform: translateX(22px); }
          80%  { transform: translateX(-10px); }
          100% { transform: translateX(8px); }
        }
      `} />
      {/* outer: sobe; inner: balança lateralmente */}
      <div style={{
        position: 'fixed',
        bottom: -60,
        left: 'calc(50% - 24px)',
        animation: 'eg-up-rise 4.2s cubic-bezier(0.15,0.5,0.5,1) forwards',
        pointerEvents: 'none',
      }}>
        <div style={{
          animation: 'eg-up-sway 2.1s ease-in-out infinite',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0,
        }}>
          <span style={{ fontSize: 44, lineHeight: 1 }}>🎈</span>
          {/* cordinha */}
          <div style={{ width: 2, height: 18, background: 'rgba(255,255,255,0.5)', borderRadius: 1 }}/>
          <span style={{ fontSize: 44, lineHeight: 1, marginTop: -6 }}>🏠</span>
        </div>
      </div>
    </>
  )
}

// 🍸🔫 007 — drink à esquerda, arma à direita, nível do peito
function Egg007() {
  const midY = AV_CY + 20  // nível do "peito"
  return (
    <>
      <EggStyle css={`${fadeKF}
        @keyframes eg-drink {
          0%   { opacity:0; transform:translateX(-20px) scale(0.5); }
          20%  { opacity:1; transform:translateX(0)      scale(1.1); }
          30%  { transform:scale(1); }
          75%  { opacity:1; }
          100% { opacity:0; }
        }
        @keyframes eg-gun {
          0%   { opacity:0; transform:translateX(20px) scale(0.5); }
          20%  { opacity:1; transform:translateX(0)     scale(1.1); }
          30%  { transform:scale(1); }
          75%  { opacity:1; }
          100% { opacity:0; }
        }
      `} />
      <Emoji style={{
        fontSize: 42,
        top: midY,
        left: `calc(50% - ${AV_R + 64}px)`,
        animation: 'eg-drink 2.6s ease-out forwards',
        opacity: 0,
      }}>🍸</Emoji>
      <Emoji style={{
        fontSize: 42,
        top: midY,
        left: `calc(50% + ${AV_R + 18}px)`,
        animation: 'eg-gun 2.6s 0.15s ease-out forwards',
        opacity: 0,
      }}>🔫</Emoji>
    </>
  )
}

// 🃏 BATMAN — carta vira rapidinho perto do avatar
function EggBatman() {
  const cardY = AV_CY - 20
  return (
    <>
      <EggStyle css={`
        @keyframes eg-card {
          0%   { opacity:0; transform:translateX(60px) rotate(30deg) scale(0.4); }
          20%  { opacity:1; transform:translateX(0)    rotate(-5deg) scale(1.05); }
          35%  { transform:rotate(3deg) scale(1); }
          75%  { opacity:1; }
          100% { opacity:0; transform:rotate(-8deg) translateY(10px); }
        }
      `} />
      <Emoji style={{
        fontSize: 52,
        top: cardY,
        left: `calc(50% + ${AV_R + 12}px)`,
        animation: 'eg-card 2.4s ease-out forwards',
        opacity: 0,
      }}>🃏</Emoji>
    </>
  )
}

// 🕛🌙🌃 MEIA-NOITE EM PARIS — relógio embaixo, lua/cidade no fundo
function EggParis() {
  return (
    <>
      <EggStyle css={`${fadeKF}`} />
      {/* cidade ao fundo, bem grande e transparente */}
      <FadeEmoji size={120} top={AV_TOP - 40} left={'calc(50% - 60px)'}
        duration={3} style={{ opacity: 0, filter: 'saturate(0.5)' }}>🌃</FadeEmoji>
      {/* lua no canto superior */}
      <FadeEmoji size={40} top={AV_TOP - 10} left={'calc(50% + 58px)'}
        delay={0.1} duration={2.8}>🌙</FadeEmoji>
      {/* relógio marcando meia-noite, abaixo do avatar */}
      <FadeEmoji size={48} top={AV_CY + AV_R + 8} left={'calc(50% - 24px)'}
        delay={0.2} duration={3}>🕛</FadeEmoji>
    </>
  )
}

// 🍳🍩♣️ CLUBE DOS CINCO — café da manhã ao redor
function EggClube() {
  return (
    <>
      <EggStyle css={`${fadeKF}`} />
      {/* ovo/panela à esquerda */}
      <FadeEmoji size={40} top={AV_CY} left={`calc(50% - ${AV_R + 56}px)`}
        delay={0}   duration={2.6}>🍳</FadeEmoji>
      {/* rosquinha acima-direita */}
      <FadeEmoji size={40} top={AV_TOP + 4} left={`calc(50% + ${AV_R + 10}px)`}
        delay={0.1} duration={2.6}>🍩</FadeEmoji>
      {/* ♣ abaixo */}
      <FadeEmoji size={40} top={AV_CY + AV_R + 14} left={'calc(50% - 20px)'}
        delay={0.2} duration={2.6}>♣️</FadeEmoji>
    </>
  )
}

// 🛳 TITANIC — o barco inclina e afunda, depois volta
function EggTitanic() {
  return (
    <>
      <EggStyle css={`
        @keyframes eg-titanic {
          0%   { transform:rotate(0deg)   translateY(0);    opacity:1; }
          25%  { transform:rotate(-18deg) translateY(0);    opacity:1; }
          55%  { transform:rotate(-35deg) translateY(80px); opacity:0.3; }
          56%  { transform:rotate(0deg)   translateY(80px); opacity:0; }
          70%  { transform:rotate(0deg)   translateY(0);    opacity:1; }
          85%  { opacity:1; }
          100% { opacity:0; }
        }
      `} />
      <Emoji style={{
        fontSize: 72,
        top: AV_CY + AV_R + 10,
        left: 'calc(50% - 36px)',
        transformOrigin: 'bottom right',
        animation: 'eg-titanic 4.2s ease-in-out forwards',
      }}>🛳</Emoji>
    </>
  )
}

// 🥐💥🔫🌹 CHEFÃO — os ícones surgem ao redor do avatar
function EggChefao() {
  return (
    <>
      <EggStyle css={`${fadeKF}`} />
      {/* pão ao topo-esq */}
      <FadeEmoji size={36} top={AV_TOP + 8}            left={`calc(50% - ${AV_R + 46}px)`} delay={0}   duration={2.8}>🥐</FadeEmoji>
      {/* explosão no topo-dir */}
      <FadeEmoji size={40} top={AV_TOP + 4}            left={`calc(50% + ${AV_R + 12}px)`} delay={0.1} duration={2.8}>💥</FadeEmoji>
      {/* arma à esquerda, nível do peito */}
      <FadeEmoji size={36} top={AV_CY + 10}            left={`calc(50% - ${AV_R + 52}px)`} delay={0.2} duration={2.8}>🔫</FadeEmoji>
      {/* rosa abaixo do avatar */}
      <FadeEmoji size={36} top={AV_CY + AV_R + 12}     left={'calc(50% - 18px)'}             delay={0.3} duration={2.8}>🌹</FadeEmoji>
    </>
  )
}

// =============================================================================
//  EXPORT PRINCIPAL
// =============================================================================
export function EasterEgg({ egg }: { egg: EggType }) {
  if (!egg) return null

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 1000 }}
    >
      {egg === 'lion'    && <EggLion />}
      {egg === 'up'      && <EggUp />}
      {egg === '007'     && <Egg007 />}
      {egg === 'batman'  && <EggBatman />}
      {egg === 'paris'   && <EggParis />}
      {egg === 'clube'   && <EggClube />}
      {egg === 'titanic' && <EggTitanic />}
      {egg === 'chefao'  && <EggChefao />}
    </div>
  )
}