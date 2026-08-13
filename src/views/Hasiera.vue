<script setup>
import { computed, onMounted, ref } from 'vue'
import { useStatsService } from '@/composables/useStatsService'
import { getDailyChallengeState } from '@/utils/dailyWord'
import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  Check,
  Flame,
  ListChecks,
  MessageCircle,
  Play,
  Puzzle,
  Shuffle,
  Sparkles,
  Table,
  Target,
  TrendingUp,
  Users,
} from 'lucide-vue-next'

const DAILY_GOAL = 10
const { getLearningOverview } = useStatsService()
const overview = ref(null)
const isLoading = ref(true)
const dailyChallenge = ref(null)

const games = [
  {
    title: 'Hiztegle',
    description: 'Asmatu hitza definizioarekin.',
    route: '/hiztegle',
    icon: Puzzle,
    tone: 'hiztegle',
  },
  {
    title: 'Sinonimoak',
    description: 'Aberastu hiztegia jolasten.',
    route: '/sinonimoak-jokoa',
    icon: Shuffle,
    tone: 'sinonimoak',
  },
  {
    title: 'Aditzak',
    description: 'Indartu aditz laguntzaileak.',
    route: '/aditzak',
    icon: MessageCircle,
    tone: 'aditzak',
  },
]

const resources = [
  { title: 'Sinonimoen zerrenda', route: '/sinonimoak-zerrenda', icon: ListChecks },
  { title: 'C1-eko hiztegia', route: '/hiztegia', icon: BookOpen },
  { title: 'Aditz taulak', route: '/aditz-taulak', icon: Table },
]

const goalCompleted = computed(() => overview.value?.todayAttempts >= DAILY_GOAL)
const recommendationIcon = computed(() => (
  games.find(game => game.route === overview.value?.recommendation?.route)?.icon || Puzzle
))
const accuracyLabel = computed(() => overview.value?.accuracy === null ? '—' : `${overview.value.accuracy}%`)
const changeLabel = computed(() => {
  const change = overview.value?.accuracyChange
  if (change === null || change === undefined || change === 0) return 'aurreko astearen pare'
  return `${change > 0 ? '+' : ''}${change} puntu aurreko astetik`
})

onMounted(async () => {
  dailyChallenge.value = getDailyChallengeState()
  try {
    overview.value = await getLearningOverview(DAILY_GOAL)
  } catch (error) {
    console.error('Ezin izan da aurrerapena kargatu:', error)
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <main class="home-shell">
    <header class="home-hero">
      <div class="brand-mark" aria-hidden="true">
        <img src="/logo.svg" alt="" class="brand-mark__logo" />
        <Sparkles class="brand-mark__spark brand-mark__spark--one" />
        <Sparkles class="brand-mark__spark brand-mark__spark--two" />
      </div>
      <div>
        <p class="home-hero__eyebrow">Jokatu!</p>
        <h1 class="home-hero__title">Egunero pixka bat,<br />euskara hobetzeko.</h1>
        <p class="home-hero__desc">Gaurko erronka laburra prest daukazu.</p>
      </div>
    </header>

    <router-link to="/hiztegle/eguneroko" class="daily-hero" :class="{ 'daily-hero--done': dailyChallenge }">
      <div class="daily-hero__icon">
        <CalendarCheck v-if="dailyChallenge" class="w-6 h-6" />
        <Puzzle v-else class="w-6 h-6" />
      </div>
      <div class="daily-hero__body">
        <span class="daily-hero__eyebrow">
          <Users class="w-3 h-3" /> Eguneroko erronka · denontzat hitz bera
        </span>
        <strong v-if="!dailyChallenge">Gaurko Hiztegle-a zure zain dago</strong>
        <strong v-else-if="dailyChallenge.correct">Gaurkoa gainditu duzu! 🎉</strong>
        <strong v-else>Gaurkoa amaituta duzu</strong>
        <span class="daily-hero__desc">
          <template v-if="!dailyChallenge">Egun honetan jokatzen duten guztiek hitz bera dute. Asma ezazu!</template>
          <template v-else-if="dailyChallenge.correct">{{ dailyChallenge.attempts }} saiakeratan asmatu duzu. Bihar erronka berria!</template>
          <template v-else>Hitza «{{ dailyChallenge.word }}» zen. Bihar beste aukera bat!</template>
        </span>
      </div>
      <span class="daily-hero__cta">
        {{ dailyChallenge ? 'Ikusi' : 'Jokatu orain' }} <ArrowRight class="w-4 h-4" />
      </span>
    </router-link>

    <section v-if="isLoading" class="dashboard-skeleton" aria-label="Aurrerapena kargatzen">
      <span></span><span></span><span></span>
    </section>

    <template v-else-if="overview">
      <section class="today-card" :class="{ 'today-card--complete': goalCompleted }">
        <div class="today-card__topline">
          <span class="today-card__label">
            <Check v-if="goalCompleted" class="w-4 h-4" />
            <Target v-else class="w-4 h-4" />
            {{ goalCompleted ? 'Gaurko helburua beteta!' : 'Gaurko helburua' }}
          </span>
          <span class="today-card__count">{{ overview.todayAttempts }}/{{ overview.dailyGoal }}</span>
        </div>

        <div
          class="goal-track"
          role="progressbar"
          :aria-valuenow="overview.todayAttempts"
          aria-valuemin="0"
          :aria-valuemax="overview.dailyGoal"
        >
          <span class="goal-track__fill" :style="{ width: `${overview.goalProgress}%` }"></span>
        </div>

        <router-link :to="overview.continueRoute" class="continue-button">
          <Play class="w-5 h-5 fill-current" />
          {{ goalCompleted ? 'Segi jolasten' : 'Jarraitu praktikatzen' }}
          <span class="continue-button__time">2 min</span>
        </router-link>
      </section>

      <div class="home-dashboard">
        <router-link :to="overview.recommendation.route" class="recommendation-card">
          <div class="recommendation-card__icon">
            <component :is="recommendationIcon" class="w-5 h-5" />
          </div>
          <div class="recommendation-card__body">
            <span class="recommendation-card__eyebrow">Gaurko gomendioa</span>
            <strong>{{ overview.recommendation.title }}</strong>
            <span>{{ overview.recommendation.reason }}</span>
          </div>
          <span class="recommendation-card__action">
            Hasi erronka <ArrowRight class="w-4 h-4" />
          </span>
        </router-link>

        <section class="progress-card">
          <div class="progress-card__header">
            <div>
              <span class="section-kicker">Aste honetako bilakaera</span>
              <h2>Zure erritmoa</h2>
            </div>
            <router-link to="/estatistikak" class="text-link" aria-label="Ikusi estatistika guztiak">
              Xehetasunak <ArrowRight class="w-4 h-4" />
            </router-link>
          </div>

          <div class="progress-metrics">
            <div class="metric">
              <Flame class="metric__icon metric__icon--flame" />
              <strong>{{ overview.streak }}</strong>
              <span>eguneko bolada</span>
            </div>
            <div class="metric">
              <TrendingUp class="metric__icon" />
              <strong>{{ accuracyLabel }}</strong>
              <span>zuzen · {{ changeLabel }}</span>
            </div>
          </div>

          <div class="week-strip" :aria-label="`${overview.activeDays} egun aktibo azken zazpi egunetan`">
            <div v-for="day in overview.week" :key="day.date" class="week-day">
              <span
                class="week-day__dot"
                :class="{ 'week-day__dot--active': day.active }"
                :title="day.active ? `${day.attempts} erantzun` : 'Jarduerarik ez'"
              >
                <Check v-if="day.active" class="w-4 h-4" />
              </span>
              <span class="week-day__label">{{ day.day }}</span>
            </div>
          </div>
          <p class="progress-card__summary">
            {{ overview.activeDays }}/7 egun · {{ overview.weeklyAttempts }} erantzun aste honetan
          </p>
        </section>
      </div>
    </template>

    <section class="home-section">
      <div class="home-section__heading">
        <div>
          <span class="section-kicker">Aukeratu zure erronka</span>
          <h2>Beste jokoak</h2>
        </div>
      </div>
      <div class="game-grid">
        <router-link
          v-for="game in games"
          :key="game.route"
          :to="game.route"
          class="game-tile"
          :class="`game-tile--${game.tone}`"
        >
          <span class="game-tile__icon"><component :is="game.icon" /></span>
          <span class="game-tile__title">{{ game.title }}</span>
          <span class="game-tile__desc">{{ game.description }}</span>
          <ArrowRight class="game-tile__arrow" />
        </router-link>
      </div>
    </section>

    <section class="home-section home-section--resources">
      <span class="section-kicker">Kontsultarako</span>
      <h2>Baliabideak</h2>
      <ul class="resource-list">
        <li v-for="resource in resources" :key="resource.route">
          <router-link :to="resource.route" class="resource-row">
            <component :is="resource.icon" class="resource-row__icon" />
            <span>{{ resource.title }}</span>
            <ArrowRight class="resource-row__arrow" />
          </router-link>
        </li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
.home-shell {
  width: min(100%, 72rem);
  min-height: calc(100dvh - 3.5rem);
  margin-inline: auto;
  padding: 1.25rem 1rem 3rem;
}

.home-hero {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin: 0 auto 1.5rem;
  text-align: left;
}

.brand-mark {
  position: relative;
  flex: 0 0 auto;
  padding: 0.35rem;
  border-radius: 50%;
  background: rgb(255 255 255 / 0.08);
  box-shadow: 0 0 0 1px rgb(255 255 255 / 0.08), 0 14px 40px rgb(108 76 241 / 0.28);
}

.brand-mark__logo { display: block; width: 4.25rem; height: 4.25rem; }
.brand-mark__spark { position: absolute; color: #D9CBFF; }
.brand-mark__spark--one { width: 1rem; top: -0.25rem; right: -0.1rem; }
.brand-mark__spark--two { width: 0.7rem; bottom: 0.1rem; left: -0.35rem; }

.home-hero__eyebrow,
.section-kicker {
  display: block;
  margin-bottom: 0.25rem;
  color: #BDAAFF;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.home-hero__title {
  margin: 0;
  color: var(--text-primary);
  font-size: clamp(1.5rem, 6vw, 2.5rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.08;
}

.home-hero__desc { margin: 0.5rem 0 0; color: var(--text-secondary); font-size: 0.875rem; }

.daily-hero {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.9rem;
  max-width: 42rem;
  margin: 0 auto 1.25rem;
  padding: 1.1rem 1.25rem;
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 0.14);
  border-radius: 0.5rem;
  background: linear-gradient(135deg, #7C5CF5 0%, #5636C9 100%);
  box-shadow: 0 16px 40px rgb(108 76 241 / 0.35);
  color: white;
  text-decoration: none;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
.daily-hero:hover { box-shadow: 0 20px 46px rgb(108 76 241 / 0.45); transform: translateY(-2px); }
.daily-hero--done { background: linear-gradient(135deg, #3D2F86 0%, #2A2147 100%); }

.daily-hero__icon {
  display: grid;
  flex: 0 0 auto;
  width: 3rem;
  height: 3rem;
  place-items: center;
  border-radius: 0.375rem;
  background: rgb(255 255 255 / 0.16);
}

.daily-hero__body { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 0.15rem; }
.daily-hero__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  color: rgb(255 255 255 / 0.8);
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.daily-hero__body strong { font-size: 1.05rem; font-weight: 800; }
.daily-hero__desc { overflow: hidden; color: rgb(255 255 255 / 0.85); font-size: 0.78rem; text-overflow: ellipsis; white-space: nowrap; }

.daily-hero__cta {
  display: none;
  flex: 0 0 auto;
  align-items: center;
  gap: 0.35rem;
  padding: 0.55rem 0.9rem;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.18);
  font-size: 0.78rem;
  font-weight: 800;
  white-space: nowrap;
}

.today-card,
.recommendation-card,
.progress-card {
  border: 1px solid rgb(255 255 255 / 0.12);
  border-radius: 0.375rem;
  background: #2A2147;
  box-shadow: 0 14px 35px rgb(7 4 18 / 0.18);
}

.today-card { max-width: 42rem; margin: 0 auto; padding: 1rem; }
.today-card--complete { border-color: rgb(69 196 145 / 0.5); }
.today-card__topline { display: flex; justify-content: space-between; gap: 1rem; margin-bottom: 0.65rem; }
.today-card__label { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; font-weight: 700; }
.today-card__count { color: var(--text-secondary); font-size: 0.8rem; font-weight: 700; }
.goal-track { height: 0.65rem; overflow: hidden; border-radius: 999px; background: rgb(255 255 255 / 0.1); }
.goal-track__fill { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #8A6CFF, #B7A1FF); transition: width 0.5s ease; }

.continue-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  min-height: 3.25rem;
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  background: #7C5CF5;
  box-shadow: inset 0 -4px 0 rgb(51 34 124 / 0.5);
  color: white;
  font-weight: 800;
  text-decoration: none;
  transition: transform 0.15s ease, background 0.15s ease;
}
.continue-button:hover { background: #896DF8; transform: translateY(-1px); }
.continue-button:active { transform: translateY(2px); box-shadow: inset 0 -2px 0 rgb(51 34 124 / 0.5); }
.continue-button__time { margin-left: auto; color: rgb(255 255 255 / 0.7); font-size: 0.72rem; }

.home-dashboard { display: grid; gap: 0.8rem; max-width: 42rem; margin: 0.8rem auto 0; }
.recommendation-card { position: relative; display: flex; align-items: center; gap: 0.85rem; padding: 1rem; color: inherit; text-decoration: none; transition: transform 0.18s ease, border-color 0.18s ease; }
.recommendation-card:hover { transform: translateY(-2px); border-color: rgb(189 170 255 / 0.5); }
.recommendation-card__icon { display: grid; width: 2.5rem; height: 2.5rem; place-items: center; flex: 0 0 auto; border-radius: 0.375rem; background: #EDE8FF; color: #6C4CF1; }
.recommendation-card__body { display: flex; min-width: 0; flex: 1; flex-direction: column; }
.recommendation-card__eyebrow { color: #BDAAFF; font-size: 0.65rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; }
.recommendation-card__body strong { font-size: 1rem; }
.recommendation-card__body > span:last-child { overflow: hidden; color: var(--text-secondary); font-size: 0.75rem; text-overflow: ellipsis; white-space: nowrap; }
.recommendation-card__action { display: none; align-items: center; gap: 0.25rem; color: #C6B7FF; font-size: 0.75rem; font-weight: 700; }

.progress-card { padding: 1rem; }
.progress-card__header,
.home-section__heading { display: flex; align-items: end; justify-content: space-between; gap: 1rem; }
.progress-card h2,
.home-section h2 { margin: 0; font-size: 1.15rem; font-weight: 800; letter-spacing: -0.02em; }
.text-link { display: inline-flex; align-items: center; gap: 0.25rem; color: #C6B7FF; font-size: 0.72rem; font-weight: 700; text-decoration: none; }
.progress-metrics { display: grid; grid-template-columns: 0.8fr 1.2fr; gap: 0.5rem; margin: 1rem 0; }
.metric { display: grid; grid-template-columns: auto 1fr; align-items: center; column-gap: 0.45rem; padding: 0.75rem; border-radius: 0.375rem; background: rgb(255 255 255 / 0.055); }
.metric__icon { width: 1.15rem; color: #BDAAFF; }
.metric__icon--flame { color: #FB923C; }
.metric strong { font-size: 1.2rem; line-height: 1; }
.metric span { grid-column: 1 / -1; margin-top: 0.35rem; color: var(--text-secondary); font-size: 0.65rem; }
.week-strip { display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.35rem; }
.week-day { display: flex; align-items: center; flex-direction: column; gap: 0.3rem; }
.week-day__dot { display: grid; width: 2rem; height: 2rem; place-items: center; border: 1px solid rgb(255 255 255 / 0.12); border-radius: 50%; color: transparent; background: rgb(255 255 255 / 0.05); }
.week-day__dot--active { border-color: #8064EB; color: white; background: #6C4CF1; box-shadow: 0 4px 12px rgb(108 76 241 / 0.3); }
.week-day__label { color: var(--text-muted); font-size: 0.58rem; font-weight: 800; }
.progress-card__summary { margin: 0.75rem 0 0; color: var(--text-secondary); font-size: 0.7rem; text-align: center; }

.home-section { margin-top: 2rem; }
.game-grid { display: grid; gap: 0.65rem; margin-top: 0.75rem; }
.game-tile { position: relative; display: grid; grid-template-columns: auto 1fr auto; align-items: center; column-gap: 0.8rem; padding: 1rem; border-radius: 0.375rem; color: white; text-decoration: none; transition: transform 0.15s ease, filter 0.15s ease; }
.game-tile:hover { filter: brightness(1.08); transform: translateY(-2px); }
.game-tile--hiztegle { background: #A83583; }
.game-tile--sinonimoak { background: #9B5E08; }
.game-tile--aditzak { background: #107B7B; }
.game-tile__icon { display: grid; width: 2.6rem; height: 2.6rem; place-items: center; grid-row: 1 / 3; border-radius: 0.375rem; background: rgb(255 255 255 / 0.13); }
.game-tile__icon > :deep(svg), .game-tile__icon svg { width: 1.25rem; }
.game-tile__title { align-self: end; font-size: 0.95rem; font-weight: 800; }
.game-tile__desc { align-self: start; color: rgb(255 255 255 / 0.76); font-size: 0.7rem; }
.game-tile__arrow { width: 1rem; grid-column: 3; grid-row: 1 / 3; opacity: 0.75; }

.home-section--resources { margin-top: 2.25rem; }
.resource-list { margin: 0.5rem 0 0; padding: 0; list-style: none; }
.resource-list li + li { border-top: 1px solid var(--border-card); }
.resource-row { display: flex; align-items: center; gap: 0.7rem; padding: 0.85rem 0.25rem; color: var(--text-primary); font-size: 0.85rem; font-weight: 650; text-decoration: none; }
.resource-row__icon { width: 1rem; color: var(--text-muted); }
.resource-row__arrow { width: 0.95rem; margin-left: auto; color: var(--text-muted); }

.dashboard-skeleton { display: grid; max-width: 42rem; gap: 0.75rem; margin: auto; }
.dashboard-skeleton span { height: 4rem; border-radius: 0.375rem; background: linear-gradient(90deg, #2A2147 25%, #382D59 50%, #2A2147 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
@keyframes shimmer { to { background-position: -200% 0; } }

@media (min-width: 640px) {
  .home-shell { padding-inline: 1.5rem; }
  .daily-hero__cta { display: inline-flex; }
  .recommendation-card__action { display: inline-flex; }
  .game-grid { grid-template-columns: repeat(3, 1fr); }
  .game-tile { display: flex; min-height: 9rem; align-items: flex-start; flex-direction: column; }
  .game-tile__icon { margin-bottom: 0.65rem; }
  .game-tile__arrow { position: absolute; top: 1rem; right: 1rem; }
}

@media (min-width: 768px) {
  .home-shell { min-height: 100vh; padding-top: 3rem; }
  .home-hero { margin-bottom: 2rem; }
  .brand-mark__logo { width: 5.25rem; height: 5.25rem; }
  .today-card, .home-dashboard, .daily-hero { max-width: none; }
  .home-dashboard { grid-template-columns: 0.82fr 1.18fr; align-items: stretch; }
  .recommendation-card { align-items: flex-start; flex-direction: column; padding: 1.35rem; }
  .recommendation-card__icon { width: 3rem; height: 3rem; }
  .recommendation-card__action { margin-top: auto; }
  .progress-card { padding: 1.35rem; }
  .home-section { margin-top: 2.75rem; }
}
</style>
