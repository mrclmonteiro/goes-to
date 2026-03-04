// EasterEgg.tsx — drop-in component para os easter eggs de avatar
// O avatar está centrado horizontalmente, com o topo em ~100px e 125px de diâmetro.
// Avatar center Y ≈ 162px, center X = 50vw.

'use client'

export type EggType = 'lion' | 'up' | '007' | 'batman' | 'paris' | 'clube' | 'titanic' | 'chefao' | 'compadecida' | 'central' | 'cidadededeus' | 'minhamae' | 'tropa' | 'bacurau' | 'quehoras' | 'palhaco' | 'agente' | null

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

// 👑 REI LEÃO
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

// 🎈🏠 UP
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

// 🍸🔫 007
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

// 🃏 BATMAN
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

// 🕛🌙🌃 MEIA-NOITE EM PARIS
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

// 🍳🍩♣️ CLUBE DOS CINCO
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

// 🛳 TITANIC
function EggTitanic() {
  return (
    <EggStyle css={`
      @keyframes eg-titanic {
        0%   { transform: rotate(0deg)   translateY(0); }
        20%  { transform: rotate(-25deg) translateY(0); }       /* Empina a proa */
        50%  { transform: rotate(-45deg) translateY(120px); }   /* Afunda saindo do círculo */
        70%  { transform: rotate(0deg)   translateY(120px); }   /* Fica escondido lá embaixo */
        100% { transform: rotate(0deg)   translateY(0); }       /* Emerge intacto */
      }
      
      #avatar-emoji {
        transform-origin: bottom right; 
        animation: eg-titanic 4s ease-in-out forwards;
      }
    `} />
  )
}

// 🥐💥🔫🌹 CHEFÃO
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

// 🐶🥩🧈📜 O AUTO DA COMPADECIDA — Bife fritando na manteiga e o testamento da cachorra
function EggCompadecida() {
  return (
    <>
      <EggStyle css={`${fadeKF}
        @keyframes eg-fry {
          0% { opacity: 0; transform: scale(0.5) translateY(10px); }
          20% { opacity: 1; transform: scale(1.1) translateY(0); }
          30%, 50%, 70% { transform: scale(1) translateX(-3px); }
          40%, 60%, 80% { transform: scale(1) translateX(3px); }
          90% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.8) translateY(-10px); }
        }
      `} />
      
      {/* Bife e manteiga fritando agitados à esquerda */}
      <Emoji style={{
        fontSize: 42,
        top: AV_CY - 10,
        left: `calc(50% - ${AV_R + 70}px)`,
        animation: 'eg-fry 2.6s ease-out forwards',
        opacity: 0,
        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))'
      }}>🥩🧈</Emoji>
      
      {/* Rolo de testamento surgindo à direita */}
      <FadeEmoji size={46} top={AV_CY - 5} left={`calc(50% + ${AV_R + 15}px)`}
        delay={0.3} duration={2.6}>📜</FadeEmoji>
    </>
  )
}

// 👵✍️🚌💨 CENTRAL DO BRASIL — Dora escrevendo carta enquanto o ônibus corta a tela
function EggCentral() {
  return (
    <>
      <EggStyle css={`${fadeKF}
        @keyframes eg-write {
          0%   { opacity: 0; transform: translate(20px, 20px) scale(0.5); }
          15%  { opacity: 1; transform: translate(0, 0) scale(1); }
          25%  { transform: translate(-4px, 4px) scale(1); }
          35%  { transform: translate(3px, -3px) scale(1); }
          45%  { transform: translate(-4px, 4px) scale(1); }
          55%  { transform: translate(3px, -3px) scale(1); }
          75%  { opacity: 1; }
          100% { opacity: 0; transform: translate(10px, 10px) scale(0.8); }
        }
        @keyframes eg-bus {
          0%   { transform: translateX(110vw); }
          100% { transform: translateX(-50vw); }
        }
      `} />
      
      {/* Mão escrevendo próxima ao ombro direito */}
      <Emoji style={{
        fontSize: 42,
        top: AV_CY + 5,
        left: `calc(50% + ${AV_R + 5}px)`,
        animation: 'eg-write 2.8s ease-out forwards',
        opacity: 0,
      }}>✍️</Emoji>
      
      {/* Carta de papel sendo escrita */}
      <FadeEmoji size={32} top={AV_CY - 15} left={`calc(50% + ${AV_R + 45}px)`}
        delay={0.2} duration={2.6}>✉️</FadeEmoji>

      {/* Ônibus cruzando a tela na parte de baixo */}
      <div style={{
        position: 'fixed',
        bottom: '12vh', // Fica um pouco acima da base da tela
        left: 0,
        animation: 'eg-bus 3.8s linear forwards',
        fontSize: 64,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        whiteSpace: 'nowrap',
        filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))'
      }}>
        🚌💨💨
      </div>
    </>
  )
}

// 🐔📸🏃‍♂️ CIDADE DE DEUS — Flashes do Buscapé e moleque correndo
function EggCidadeDeDeus() {
  return (
    <>
      <EggStyle css={`${fadeKF}
        @keyframes eg-flash {
          0%, 100% { opacity: 0; transform: scale(0.8); }
          10%, 30%, 50% { opacity: 1; transform: scale(1.2); filter: brightness(2) drop-shadow(0 0 10px white); }
          20%, 40% { opacity: 0; }
        }
        @keyframes eg-run {
          0% { transform: translateX(50vw) scaleX(-1); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateX(-50vw) scaleX(-1); opacity: 0; }
        }
      `} />
      <Emoji style={{ fontSize: 50, top: AV_CY - 10, left: `calc(50% - ${AV_R + 60}px)`, animation: 'eg-flash 3s ease-in-out forwards', opacity: 0 }}>📸</Emoji>
      <Emoji style={{ fontSize: 45, bottom: '20vh', left: '50%', animation: 'eg-run 3.5s linear forwards', opacity: 0, zIndex: 10 }}>🏃🏾‍♂️</Emoji>
    </>
  )
}

// 👩‍🦱🩴💨 MINHA MÃE É UMA PEÇA — Chinelo voando na diagonal e bolsa tremendo
function EggMinhaMae() {
  return (
    <>
      <EggStyle css={`${fadeKF}
        @keyframes eg-chinelo {
          0% { transform: translate(calc(50vw + 50px), ${AV_CY}px) rotate(0deg) scale(0.5); opacity: 0; }
          10% { opacity: 1; transform: translate(calc(50vw + 20px), ${AV_CY - 20}px) rotate(-45deg) scale(1.5); }
          100% { transform: translate(-20vw, -20vh) rotate(-720deg) scale(1); opacity: 1; }
        }
        @keyframes eg-shake-mad {
          0%, 100% { transform: rotate(0deg); opacity: 0; }
          10%, 90% { opacity: 1; }
          20%, 40%, 60%, 80% { transform: rotate(-15deg); }
          30%, 50%, 70% { transform: rotate(15deg); }
        }
      `} />
      <Emoji style={{ fontSize: 40, top: AV_CY, left: `calc(50% + ${AV_R + 30}px)`, animation: 'eg-shake-mad 2.8s ease-in-out forwards', opacity: 0 }}>👜</Emoji>
      <Emoji style={{ fontSize: 50, top: 0, left: 0, animation: 'eg-chinelo 2s cubic-bezier(0.25, 1, 0.5, 1) forwards', opacity: 0, zIndex: 100 }}>🩴</Emoji>
    </>
  )
}

// 💀🧹💢 TROPA DE ELITE — Vassoura batendo no chão ("pede pra sair")
function EggTropa() {
  return (
    <>
      <EggStyle css={`${fadeKF}
        @keyframes eg-broom {
          0%, 100% { opacity: 0; transform: translateY(-20px) rotate(15deg); }
          10%, 90% { opacity: 1; }
          20%, 40%, 60%, 80% { transform: translateY(15px) rotate(0deg); }
          30%, 50%, 70% { transform: translateY(-30px) rotate(20deg); }
        }
      `} />
      <Emoji style={{ fontSize: 55, top: AV_CY - 20, left: `calc(50% - ${AV_R + 60}px)`, animation: 'eg-broom 2.5s ease-in-out forwards', opacity: 0 }}>🧹</Emoji>
      <FadeEmoji size={40} top={AV_CY - 40} left={`calc(50% + ${AV_R + 10}px)`} delay={0.5} duration={2}>💢</FadeEmoji>
    </>
  )
}

// 🛸💊 BACURAU — Drone flutuando bizarro e pílulas caindo
function EggBacurau() {
  return (
    <>
      <EggStyle css={`${fadeKF}
        @keyframes eg-drone {
          0%, 100% { opacity: 0; transform: translate(0, -50px) scale(0.5); }
          20% { opacity: 1; transform: translate(-20px, -80px) scale(1); }
          40% { transform: translate(30px, -70px) scale(1.1) rotate(10deg); }
          60% { transform: translate(-10px, -90px) scale(0.9) rotate(-10deg); }
          80% { opacity: 1; transform: translate(20px, -60px) scale(1); }
        }
        @keyframes eg-pill {
          0% { opacity: 0; transform: translateY(-20px) rotate(0deg); }
          20% { opacity: 1; }
          100% { opacity: 0; transform: translateY(100px) rotate(360deg); }
        }
      `} />
      <Emoji style={{ fontSize: 50, top: AV_CY, left: '50%', animation: 'eg-drone 3s ease-in-out forwards', opacity: 0, zIndex: 50 }}>🛸</Emoji>
      <Emoji style={{ fontSize: 25, top: AV_CY - 10, left: `calc(50% - ${AV_R + 40}px)`, animation: 'eg-pill 2s ease-in forwards 0.5s', opacity: 0 }}>💊</Emoji>
      <Emoji style={{ fontSize: 25, top: AV_CY + 10, left: `calc(50% + ${AV_R + 20}px)`, animation: 'eg-pill 2.5s ease-in forwards 0.2s', opacity: 0 }}>💊</Emoji>
    </>
  )
}

// 🏊‍♀️🫖📚 QUE HORAS ELA VOLTA? — Bule sumindo e livros (vestibular) subindo
function EggQueHoras() {
  return (
    <>
      <EggStyle css={`${fadeKF}
        @keyframes eg-teapot {
          0% { opacity: 0; transform: translateX(0); }
          20% { opacity: 1; transform: translateX(0); }
          80% { opacity: 0; transform: translateX(-40px); }
          100% { opacity: 0; }
        }
        @keyframes eg-books {
          0% { opacity: 0; transform: translateY(40px); }
          30% { opacity: 1; transform: translateY(0); }
          90% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(20px); }
        }
      `} />
      <Emoji style={{ fontSize: 45, top: AV_CY, left: `calc(50% - ${AV_R + 50}px)`, animation: 'eg-teapot 2.8s ease-out forwards', opacity: 0 }}>🫖</Emoji>
      <Emoji style={{ fontSize: 45, top: AV_CY - 10, left: `calc(50% + ${AV_R + 15}px)`, animation: 'eg-books 2.8s ease-out forwards', opacity: 0 }}>📚</Emoji>
    </>
  )
}

// 🤡🌀🐈 O PALHAÇO — Ventilador girando no teto e gatinho
function EggPalhaco() {
  return (
    <>
      <EggStyle css={`${fadeKF}
        @keyframes eg-fan {
          0% { opacity: 0; transform: scale(0.5) rotate(0deg); }
          15% { opacity: 1; transform: scale(1) rotate(180deg); }
          85% { opacity: 1; transform: scale(1) rotate(1080deg); }
          100% { opacity: 0; transform: scale(0.5) rotate(1260deg); }
        }
      `} />
      <Emoji style={{ fontSize: 50, top: AV_TOP - 40, left: 'calc(50% - 25px)', animation: 'eg-fan 3s linear forwards', opacity: 0 }}>🌀</Emoji>
      <FadeEmoji size={40} top={AV_CY + 15} left={`calc(50% - ${AV_R + 40}px)`} delay={0.2} duration={2.6}>🐈</FadeEmoji>
    </>
  )
}

// 🦈🦵🎊 O AGENTE SECRETO — Perna Cabeluda pulando e bloco de Carnaval no Recife
function EggAgenteSecreto() {
  return (
    <>
      <EggStyle css={`${fadeKF}
        @keyframes eg-bounce-leg {
          0% { transform: translate(-20vw, 80vh) rotate(-30deg); opacity: 0; }
          10% { opacity: 1; transform: translate(10vw, 40vh) rotate(10deg); }
          25% { transform: translate(30vw, 80vh) rotate(-20deg); }
          40% { transform: translate(50vw, 40vh) rotate(15deg); }
          55% { transform: translate(70vw, 80vh) rotate(-25deg); }
          70% { transform: translate(90vw, 40vh) rotate(10deg); }
          85% { opacity: 1; transform: translate(110vw, 80vh) rotate(-20deg); }
          100% { opacity: 0; transform: translate(130vw, 80vh); }
        }
        @keyframes eg-carnival-pop {
          0% { transform: scale(0) translateY(50px) rotate(-10deg); opacity: 0; }
          20% { transform: scale(1.2) translateY(0) rotate(5deg); opacity: 1; }
          80% { transform: scale(1) translateY(0) rotate(-5deg); opacity: 1; }
          100% { transform: scale(0.5) translateY(-50px) rotate(10deg); opacity: 0; }
        }
      `} />
      
      {/* Elementos de Carnaval aparecendo em volta (como um bloquinho) */}
      <Emoji style={{ fontSize: 45, top: AV_CY - 30, left: `calc(50% - ${AV_R + 60}px)`, animation: 'eg-carnival-pop 3.5s ease-out forwards', opacity: 0, animationDelay: '0.1s' }}>🎊</Emoji>
      <Emoji style={{ fontSize: 50, top: AV_CY + 20, left: `calc(50% + ${AV_R + 30}px)`, animation: 'eg-carnival-pop 3.5s ease-out forwards', opacity: 0, animationDelay: '0.4s' }}>🎺</Emoji>
      <Emoji style={{ fontSize: 40, top: AV_CY - 60, left: `calc(50% + ${AV_R + 10}px)`, animation: 'eg-carnival-pop 3.5s ease-out forwards', opacity: 0, animationDelay: '0.6s' }}>🎉</Emoji>
      <Emoji style={{ fontSize: 45, top: AV_CY + 40, left: `calc(50% - ${AV_R + 40}px)`, animation: 'eg-carnival-pop 3.5s ease-out forwards', opacity: 0, animationDelay: '0.2s' }}>🎭</Emoji>

      {/* A lendária Perna Cabeluda quicando pela tela inteira */}
      <Emoji style={{ fontSize: 80, top: 0, left: 0, animation: 'eg-bounce-leg 3.8s cubic-bezier(0.3, 0.8, 0.7, 1) forwards', opacity: 0, zIndex: 100 }}>🦵</Emoji>
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
      {egg === 'lion'        && <EggLion />}
      {egg === 'up'          && <EggUp />}
      {egg === '007'         && <Egg007 />}
      {egg === 'batman'      && <EggBatman />}
      {egg === 'paris'       && <EggParis />}
      {egg === 'clube'       && <EggClube />}
      {egg === 'titanic'     && <EggTitanic />}
      {egg === 'chefao'      && <EggChefao />}
      {egg === 'compadecida' && <EggCompadecida />}
      {egg === 'central'     && <EggCentral />}
      {egg === 'compadecida' && <EggCompadecida />}
      {egg === 'central'     && <EggCentral />}
      {egg === 'cidadededeus'&& <EggCidadeDeDeus />}
      {egg === 'minhamae'    && <EggMinhaMae />}
      {egg === 'tropa'       && <EggTropa />}
      {egg === 'bacurau'     && <EggBacurau />}
      {egg === 'quehoras'    && <EggQueHoras />}
      {egg === 'palhaco'     && <EggPalhaco />}
      {egg === 'palhaco'     && <EggPalhaco />}
      {egg === 'agente'      && <EggAgenteSecreto />}
    </div>
  )
}