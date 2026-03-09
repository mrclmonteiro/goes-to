/**
 * seed-nominations.ts
 *
 * Popula o Supabase com filmes e indicações do Oscar 98ª edição (2026).
 * É 100% SEGURO rodar mesmo com dados existentes — nunca sobrescreve nem deleta.
 *
 * Pré-requisitos:
 *   1. Crie um arquivo .env.local na raiz com:
 *        NEXT_PUBLIC_SUPABASE_URL=...
 *        SUPABASE_SERVICE_ROLE_KEY=...   ← chave "service_role" do Supabase (não a anon)
 *        NEXT_PUBLIC_TMDB_TOKEN=...
 *   2. npx tsx scripts/seed-nominations.ts
 */

import { createClient } from '@supabase/supabase-js'
import { config as loadEnv } from 'dotenv'
import { resolve } from 'path'

loadEnv({ path: resolve(process.cwd(), '.env.local') })

// ─── Credenciais ───────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY // service_role, não anon

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('⛔  Faltam variáveis de ambiente. Veja o cabeçalho do script.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ─── Dados completos de indicações ────────────────────────────────────────────
// Formato: { category, film, nominee? }
// nominee = pessoa (ator/diretor/DOP etc.) quando há destaque individual
// nominee = null   quando a indicação é só o filme

type NomEntry = { category: string; film: string; nominee?: string }

const NOMINATIONS: NomEntry[] = [
  // ── Best Picture ─────────────────────────────────────────────────────────
  { category: 'Best Picture', film: 'Bugonia' },
  { category: 'Best Picture', film: 'F1' },
  { category: 'Best Picture', film: 'Frankenstein' },
  { category: 'Best Picture', film: 'Hamnet' },
  { category: 'Best Picture', film: 'Marty Supreme' },
  { category: 'Best Picture', film: 'One Battle after Another' },
  { category: 'Best Picture', film: 'The Secret Agent' },
  { category: 'Best Picture', film: 'Sentimental Value' },
  { category: 'Best Picture', film: 'Sinners' },
  { category: 'Best Picture', film: 'Train Dreams' },

  // ── Best Director ─────────────────────────────────────────────────────────
  { category: 'Best Director', film: 'Hamnet',               nominee: 'Chloé Zhao' },
  { category: 'Best Director', film: 'Marty Supreme',        nominee: 'Josh Safdie' },
  { category: 'Best Director', film: 'One Battle after Another', nominee: 'Paul Thomas Anderson' },
  { category: 'Best Director', film: 'Sentimental Value',    nominee: 'Joachim Trier' },
  { category: 'Best Director', film: 'Sinners',              nominee: 'Ryan Coogler' },

  // ── Best Actor (Leading) ──────────────────────────────────────────────────
  { category: 'Best Actor', film: 'Marty Supreme',           nominee: 'Timothée Chalamet' },
  { category: 'Best Actor', film: 'One Battle after Another',nominee: 'Leonardo DiCaprio' },
  { category: 'Best Actor', film: 'Blue Moon',               nominee: 'Ethan Hawke' },
  { category: 'Best Actor', film: 'Sinners',                 nominee: 'Michael B. Jordan' },
  { category: 'Best Actor', film: 'The Secret Agent',        nominee: 'Wagner Moura' },

  // ── Best Actress (Leading) ────────────────────────────────────────────────
  { category: 'Best Actress', film: 'Hamnet',                    nominee: 'Jessie Buckley' },
  { category: 'Best Actress', film: 'If I Had Legs I\'d Kick You', nominee: 'Rose Byrne' },
  { category: 'Best Actress', film: 'Song Sung Blue',             nominee: 'Kate Hudson' },
  { category: 'Best Actress', film: 'Sentimental Value',          nominee: 'Renate Reinsve' },
  { category: 'Best Actress', film: 'Bugonia',                    nominee: 'Emma Stone' },

  // ── Best Supporting Actor ─────────────────────────────────────────────────
  { category: 'Best Supporting Actor', film: 'One Battle after Another', nominee: 'Benicio Del Toro' },
  { category: 'Best Supporting Actor', film: 'Frankenstein',              nominee: 'Jacob Elordi' },
  { category: 'Best Supporting Actor', film: 'Sinners',                   nominee: 'Delroy Lindo' },
  { category: 'Best Supporting Actor', film: 'One Battle after Another',  nominee: 'Sean Penn' },
  { category: 'Best Supporting Actor', film: 'Sentimental Value',         nominee: 'Stellan Skarsgård' },

  // ── Best Supporting Actress ───────────────────────────────────────────────
  { category: 'Best Supporting Actress', film: 'Sentimental Value',         nominee: 'Elle Fanning' },
  { category: 'Best Supporting Actress', film: 'Sentimental Value',         nominee: 'Inga Ibsdotter Lilleaas' },
  { category: 'Best Supporting Actress', film: 'Weapons',                   nominee: 'Amy Madigan' },
  { category: 'Best Supporting Actress', film: 'Sinners',                   nominee: 'Wunmi Mosaku' },
  { category: 'Best Supporting Actress', film: 'One Battle after Another',  nominee: 'Teyana Taylor' },

  // ── Best Adapted Screenplay ───────────────────────────────────────────────
  { category: 'Best Adapted Screenplay', film: 'Bugonia',                nominee: 'Will Tracy' },
  { category: 'Best Adapted Screenplay', film: 'Frankenstein',           nominee: 'Guillermo del Toro' },
  { category: 'Best Adapted Screenplay', film: 'Hamnet',                 nominee: 'Chloé Zhao & Maggie O\'Farrell' },
  { category: 'Best Adapted Screenplay', film: 'One Battle after Another', nominee: 'Paul Thomas Anderson' },
  { category: 'Best Adapted Screenplay', film: 'Train Dreams',           nominee: 'Clint Bentley & Greg Kwedar' },

  // ── Best Original Screenplay ──────────────────────────────────────────────
  { category: 'Best Original Screenplay', film: 'Blue Moon',             nominee: 'Robert Kaplow' },
  { category: 'Best Original Screenplay', film: 'It Was Just an Accident', nominee: 'Jafar Panahi' },
  { category: 'Best Original Screenplay', film: 'Marty Supreme',         nominee: 'Ronald Bronstein & Josh Safdie' },
  { category: 'Best Original Screenplay', film: 'Sentimental Value',     nominee: 'Eskil Vogt & Joachim Trier' },
  { category: 'Best Original Screenplay', film: 'Sinners',               nominee: 'Ryan Coogler' },

  // ── Best Animated Feature ─────────────────────────────────────────────────
  { category: 'Best Animated Feature', film: 'Arco' },
  { category: 'Best Animated Feature', film: 'Elio' },
  { category: 'Best Animated Feature', film: 'KPop Demon Hunters' },
  { category: 'Best Animated Feature', film: 'Little Amélie or the Character of Rain' },
  { category: 'Best Animated Feature', film: 'Zootopia 2' },

  // ── Best International Feature ────────────────────────────────────────────
  { category: 'Best International Feature', film: 'The Secret Agent',        nominee: 'Brasil' },
  { category: 'Best International Feature', film: 'It Was Just an Accident', nominee: 'França' },
  { category: 'Best International Feature', film: 'Sentimental Value',       nominee: 'Noruega' },
  { category: 'Best International Feature', film: 'Sirāt',                   nominee: 'Espanha' },
  { category: 'Best International Feature', film: 'The Voice of Hind Rajab', nominee: 'Tunísia' },

  // ── Best Documentary Feature ─────────────────────────────────────────────
  { category: 'Best Documentary Feature', film: 'The Alabama Solution' },
  { category: 'Best Documentary Feature', film: 'Come See Me in the Good Light' },
  { category: 'Best Documentary Feature', film: 'Cutting through Rocks' },
  { category: 'Best Documentary Feature', film: 'Mr. Nobody against Putin' },
  { category: 'Best Documentary Feature', film: 'The Perfect Neighbor' },

  // ── Best Documentary Short Film (NOVA categoria) ─────────────────────────
  { category: 'Best Documentary Short Film', film: 'All the Empty Rooms' },
  { category: 'Best Documentary Short Film', film: 'Armed Only with a Camera: The Life and Death of Brent Renaud' },
  { category: 'Best Documentary Short Film', film: 'Children No More: \u201cWere and Are Gone\u201d' },
  { category: 'Best Documentary Short Film', film: 'The Devil Is Busy' },
  { category: 'Best Documentary Short Film', film: 'Perfectly a Strangeness' },

  // ── Best Animated Short Film (NOVA categoria) ────────────────────────────
  { category: 'Best Animated Short Film', film: 'Butterfly' },
  { category: 'Best Animated Short Film', film: 'Forevergreen' },
  { category: 'Best Animated Short Film', film: 'The Girl Who Cried Pearls' },
  { category: 'Best Animated Short Film', film: 'Retirement Plan' },
  { category: 'Best Animated Short Film', film: 'The Three Sisters' },

  // ── Best Live Action Short Film (NOVA categoria) ─────────────────────────
  { category: 'Best Live Action Short Film', film: 'Butcher\'s Stain' },
  { category: 'Best Live Action Short Film', film: 'A Friend of Dorothy' },
  { category: 'Best Live Action Short Film', film: 'Jane Austen\'s Period Drama' },
  { category: 'Best Live Action Short Film', film: 'The Singers' },
  { category: 'Best Live Action Short Film', film: 'Two People Exchanging Saliva' },

  // ── Best Cinematography ───────────────────────────────────────────────────
  { category: 'Best Cinematography', film: 'Frankenstein',            nominee: 'Dan Laustsen' },
  { category: 'Best Cinematography', film: 'Marty Supreme',           nominee: 'Darius Khondji' },
  { category: 'Best Cinematography', film: 'One Battle after Another',nominee: 'Michael Bauman' },
  { category: 'Best Cinematography', film: 'Sinners',                 nominee: 'Autumn Durald Arkapaw' },
  { category: 'Best Cinematography', film: 'Train Dreams',            nominee: 'Adolpho Veloso' },

  // ── Best Film Editing ─────────────────────────────────────────────────────
  { category: 'Best Film Editing', film: 'F1',                    nominee: 'Stephen Mirrione' },
  { category: 'Best Film Editing', film: 'Marty Supreme',         nominee: 'Ronald Bronstein e Josh Safdie' },
  { category: 'Best Film Editing', film: 'One Battle after Another', nominee: 'Andy Jurgensen' },
  { category: 'Best Film Editing', film: 'Sentimental Value',     nominee: 'Olivier Bugge Coutté' },
  { category: 'Best Film Editing', film: 'Sinners',               nominee: 'Michael P. Shawver' },

  // ── Best Production Design ────────────────────────────────────────────────
  { category: 'Best Production Design', film: 'Frankenstein',            nominee: 'Tamara Deverell' },
  { category: 'Best Production Design', film: 'Hamnet',                  nominee: 'Fiona Crombie' },
  { category: 'Best Production Design', film: 'Marty Supreme',           nominee: 'Jack Fisk' },
  { category: 'Best Production Design', film: 'One Battle after Another',nominee: 'Florencia Martin' },
  { category: 'Best Production Design', film: 'Sinners',                 nominee: 'Hannah Beachler' },

  // ── Best Costume Design ───────────────────────────────────────────────────
  { category: 'Best Costume Design', film: 'Avatar: Fire and Ash',  nominee: 'Deborah L. Scott' },
  { category: 'Best Costume Design', film: 'Frankenstein',          nominee: 'Kate Hawley' },
  { category: 'Best Costume Design', film: 'Hamnet',                nominee: 'Malgosia Turzanska' },
  { category: 'Best Costume Design', film: 'Marty Supreme',         nominee: 'Miyako Bellizzi' },
  { category: 'Best Costume Design', film: 'Sinners',               nominee: 'Ruth E. Carter' },

  // ── Best Makeup and Hairstyling ───────────────────────────────────────────
  { category: 'Best Makeup and Hairstyling', film: 'Frankenstein',         nominee: 'Mike Hill, Jordan Samuel e Cliona Furey' },
  { category: 'Best Makeup and Hairstyling', film: 'Kokuho',               nominee: 'Kyoko Toyokawa, Naomi Hibino e Tadashi Nishimatsu' },
  { category: 'Best Makeup and Hairstyling', film: 'Sinners',              nominee: 'Ken Diaz, Mike Fontaine e Shunika Terry' },
  { category: 'Best Makeup and Hairstyling', film: 'The Smashing Machine', nominee: 'Kazu Hiro, Glen Griffin e Bjoern Rehbein' },
  { category: 'Best Makeup and Hairstyling', film: 'The Ugly Stepsister',  nominee: 'Thomas Foldberg e Anne Cathrine Sauerberg' },

  // ── Best Sound ────────────────────────────────────────────────────────────
  { category: 'Best Sound', film: 'F1',                     nominee: 'Gareth John et al.' },
  { category: 'Best Sound', film: 'Frankenstein',           nominee: 'Greg Chapman et al.' },
  { category: 'Best Sound', film: 'One Battle after Another', nominee: 'José Antonio García et al.' },
  { category: 'Best Sound', film: 'Sinners',                nominee: 'Chris Welcker et al.' },
  { category: 'Best Sound', film: 'Sirāt',                  nominee: 'Amanda Villavieja et al.' },

  // ── Best Visual Effects ───────────────────────────────────────────────────
  { category: 'Best Visual Effects', film: 'Avatar: Fire and Ash',    nominee: 'Joe Letteri et al.' },
  { category: 'Best Visual Effects', film: 'F1',                      nominee: 'Ryan Tudhope et al.' },
  { category: 'Best Visual Effects', film: 'Jurassic World Rebirth',  nominee: 'David Vickery et al.' },
  { category: 'Best Visual Effects', film: 'The Lost Bus',            nominee: 'Charlie Noble et al.' },
  { category: 'Best Visual Effects', film: 'Sinners',                 nominee: 'Michael Ralla et al.' },

  // ── Best Original Score ───────────────────────────────────────────────────
  { category: 'Best Original Score', film: 'Bugonia',                 nominee: 'Jerskin Fendrix' },
  { category: 'Best Original Score', film: 'Frankenstein',            nominee: 'Alexandre Desplat' },
  { category: 'Best Original Score', film: 'Hamnet',                  nominee: 'Max Richter' },
  { category: 'Best Original Score', film: 'One Battle after Another',nominee: 'Jonny Greenwood' },
  { category: 'Best Original Score', film: 'Sinners',                 nominee: 'Ludwig Göransson' },

  // ── Best Original Song ────────────────────────────────────────────────────
  { category: 'Best Original Song', film: 'Diane Warren: Relentless', nominee: '"Dear Me" — Diane Warren' },
  { category: 'Best Original Song', film: 'KPop Demon Hunters',       nominee: '"Golden"' },
  { category: 'Best Original Song', film: 'Sinners',                  nominee: '"I Lied To You"' },
  { category: 'Best Original Song', film: 'Viva Verdi!',              nominee: '"Sweet Dreams Of Joy"' },
  { category: 'Best Original Song', film: 'Train Dreams',             nominee: '"Train Dreams"' },

  // ── Best Casting ──────────────────────────────────────────────────────────
  { category: 'Best Casting', film: 'Hamnet',                nominee: 'Nina Gold' },
  { category: 'Best Casting', film: 'Marty Supreme',         nominee: 'Jennifer Venditti' },
  { category: 'Best Casting', film: 'One Battle after Another', nominee: 'Cassandra Kulukundis' },
  { category: 'Best Casting', film: 'The Secret Agent',      nominee: 'Gabriel Domingues' },
  { category: 'Best Casting', film: 'Sinners',               nominee: 'Francine Maisler' },
]

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔍  Buscando dados existentes no Supabase...\n')

  // 1. Carregar filmes e indicações existentes
  const [{ data: existingFilms, error: efErr }, { data: existingNoms, error: enErr }] =
    await Promise.all([
      supabase.from('films').select('id, title'),
      supabase.from('nominations').select('film_id, category, nominee'),
    ])

  if (efErr || enErr) {
    console.error('⛔  Erro ao ler Supabase:', efErr ?? enErr)
    process.exit(1)
  }

  const existingFilmIds  = new Set((existingFilms ?? []).map((f: { id: string }) => f.id))
  const existingFilmTitles = new Map(
    (existingFilms ?? []).map((f: { id: string; title: string }) => [f.title.toLowerCase(), f.id])
  )

  // Chave de deduplicação para indicações existentes
  const nomKey = (filmId: string, cat: string, nominee: string | null) =>
    `${filmId}|${cat}|${nominee ?? ''}`
  const existingNomKeys = new Set(
    (existingNoms ?? []).map((n: { film_id: string; category: string; nominee: string | null }) =>
      nomKey(n.film_id, n.category, n.nominee)
    )
  )

  // 2. Descobrir filmes únicos necessários
  const uniqueFilms = [...new Set(NOMINATIONS.map(n => n.film))]
  console.log(`📋  ${uniqueFilms.length} filmes únicos na lista completa de indicados`)
  console.log(`📦  ${existingFilmIds.size} filmes já existem no banco\n`)

  // 3. Separar filmes que ainda não existem no banco (comparação case-insensitive)
  const filmIdMap = new Map<string, string>() // title → uuid

  // Mapear filmes já existentes
  for (const title of uniqueFilms) {
    const existingId = existingFilmTitles.get(title.toLowerCase())
    if (existingId) filmIdMap.set(title, existingId)
  }

  const titlesToInsert = uniqueFilms.filter(t => !filmIdMap.has(t))

  // 4. Inserir filmes novos — sem especificar id, o Supabase gera UUIDs automaticamente
  if (titlesToInsert.length === 0) {
    console.log('✅  Nenhum filme novo para inserir.')
  } else {
    console.log(`➕  Inserindo ${titlesToInsert.length} filmes novos...`)
    const { error } = await supabase
      .from('films')
      .insert(titlesToInsert.map(title => ({ title })))
    if (error) {
      console.error('⛔  Erro ao inserir filmes:', error.message)
      process.exit(1)
    }
    console.log('✅  Filmes inseridos.')

    // Buscar os UUIDs recém-gerados pelo banco
    const { data: newFilms, error: fetchErr } = await supabase
      .from('films')
      .select('id, title')
      .in('title', titlesToInsert)
    if (fetchErr || !newFilms) {
      console.error('⛔  Erro ao reler filmes inseridos:', fetchErr?.message)
      process.exit(1)
    }
    for (const f of newFilms as { id: string; title: string }[]) {
      filmIdMap.set(f.title, f.id)
      // Também indexar pela chave case-insensitive (para títulos com variações)
      existingFilmTitles.set(f.title.toLowerCase(), f.id)
    }
  }

  // 5. Montar indicações a inserir
  const toInsertNoms: { film_id: string; category: string; nominee: string | null }[] = []

  for (const nom of NOMINATIONS) {
    const filmId = filmIdMap.get(nom.film)
    if (!filmId) {
      console.warn(`⚠️  Filme sem ID mapeado: "${nom.film}" — indicação em ${nom.category} ignorada.`)
      continue
    }
    const key = nomKey(filmId, nom.category, nom.nominee ?? null)
    if (!existingNomKeys.has(key)) {
      toInsertNoms.push({ film_id: filmId, category: nom.category, nominee: nom.nominee ?? null })
    }
  }

  // 6. Inserir indicações novas
  if (toInsertNoms.length === 0) {
    console.log('\n✅  Nenhuma indicação nova para inserir.')
  } else {
    console.log(`\n➕  Inserindo ${toInsertNoms.length} indicações novas...`)
    // Insere em lotes de 50 para evitar payloads grandes
    const BATCH = 50
    for (let i = 0; i < toInsertNoms.length; i += BATCH) {
      const batch = toInsertNoms.slice(i, i + BATCH)
      const { error } = await supabase.from('nominations').insert(batch)
      if (error) {
        console.error(`⛔  Erro no lote ${i / BATCH + 1}:`, error.message)
        process.exit(1)
      }
    }
    console.log('✅  Indicações inseridas.')
  }

  // 7. Resumo final
  console.log('\n────────────────────────────────')
  console.log('📊  Resumo:')
  console.log(`    Filmes já existentes : ${existingFilmIds.size}`)
  console.log(`    Filmes inseridos     : ${titlesToInsert.length}`)
  console.log(`    Indicações inseridas : ${toInsertNoms.length}`)
  console.log('\n🎬  Pronto!')
}

main().catch(err => { console.error(err); process.exit(1) })
