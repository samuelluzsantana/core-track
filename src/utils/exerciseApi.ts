/**
 * ExerciseDB OSS API Integration
 * Fetches exercises from oss.exercisedb.dev and caches locally.
 * Falls back to static exercise definitions if API is unreachable.
 */
import { ExerciseDBExercise, ExerciseDBCache, ExerciseDef, SafetyLevel } from '../types';

const API_BASE = 'https://oss.exercisedb.dev/api/v1';
const CACHE_KEY = 'coretracker_exercisedb_cache';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ─── Static Fallback Exercises ──────────────────────────────

export const STATIC_EXERCISES: ExerciseDef[] = [
  {
    id: 'deadBug',
    name: 'Dead Bug',
    category: 'Abdominal',
    impact: 'Baixo',
    safetyLevel: 'baixoImpacto',
    focus: 'Estabilidade lombar',
    description:
      'Deite de costas, eleve braços e pernas a 90 graus. Estenda braço e perna opostos sem curvar a lombar.',
    instructions: [
      'Deite de costas com joelhos dobrados a 90°',
      'Eleve os braços em direção ao teto',
      'Estenda lentamente o braço direito e a perna esquerda',
      'Retorne e repita com o lado oposto',
    ],
    tips: [
      'Mantenha a lombar pressionada contra o chão',
      'Expire ao estender, inspire ao retornar',
    ],
    targetMuscles: ['Rectus Abdominis', 'Transverse Abdominis'],
  },
  {
    id: 'crunch',
    name: 'Crunch Curto',
    category: 'Abdominal',
    impact: 'Médio',
    safetyLevel: 'medioImpacto',
    focus: 'Reto abdominal',
    description:
      'Deite com joelhos dobrados. Eleve apenas os ombros do chão, mantendo a lombar apoiada.',
    instructions: [
      'Deite de costas com joelhos dobrados e pés no chão',
      'Coloque as mãos atrás da cabeça, sem puxar o pescoço',
      'Eleve os ombros do chão contraindo o abdômen',
      'Desça lentamente com controle',
    ],
    tips: [
      'Não puxe o pescoço com as mãos',
      'Mantenha o olhar para o teto',
    ],
    targetMuscles: ['Rectus Abdominis'],
  },
  {
    id: 'birdDog',
    name: 'Bird-Dog',
    category: 'Costas',
    impact: 'Baixo',
    safetyLevel: 'baixoImpacto',
    focus: 'Equilíbrio e extensores',
    description:
      'Em 4 apoios, estenda braço e perna opostos mantendo a coluna neutra.',
    instructions: [
      'Posicione-se em 4 apoios',
      'Estenda o braço direito e a perna esquerda simultaneamente',
      'Mantenha por 2-3 segundos',
      'Retorne e repita no lado oposto',
    ],
    tips: [
      'Mantenha o core ativado o tempo todo',
      'Não deixe o quadril rotacionar',
    ],
    targetMuscles: ['Erector Spinae', 'Gluteus Maximus'],
  },
  {
    id: 'catCow',
    name: 'Gato-Camelo',
    category: 'Costas',
    impact: 'Baixo',
    safetyLevel: 'mobilidade',
    focus: 'Alívio de tensão',
    description:
      'Em 4 apoios, alterne entre curvar as costas para cima e para baixo suavemente.',
    instructions: [
      'Posicione-se em 4 apoios com mãos sob os ombros',
      'Inspire enquanto arqueia as costas (Camelo)',
      'Expire enquanto arredonda as costas para cima (Gato)',
      'Repita de forma fluida e controlada',
    ],
    tips: [
      'Movimente-se devagar, acompanhando a respiração',
      'Excelente para aquecer antes do treino',
    ],
    targetMuscles: ['Erector Spinae', 'Rectus Abdominis'],
  },
  {
    id: 'ponteGluteo',
    name: 'Ponte de Glúteo',
    category: 'Lombar',
    impact: 'Baixo',
    safetyLevel: 'baixoImpacto',
    focus: 'Cadeia posterior',
    description:
      'Deite de costas, joelhos dobrados. Eleve o quadril contraindo os glúteos.',
    instructions: [
      'Deite de costas com joelhos dobrados e pés apoiados',
      'Ative o core e aperte os glúteos',
      'Eleve o quadril até alinhar com joelhos e ombros',
      'Segure por 2 segundos e desça lentamente',
    ],
    tips: [
      'Evite hiperestender a lombar no topo',
      'Mantenha os pés firmemente no chão',
    ],
    targetMuscles: ['Gluteus Maximus', 'Hamstrings'],
  },
  {
    id: 'supermanHold',
    name: 'Superman',
    category: 'Costas',
    impact: 'Médio',
    safetyLevel: 'medioImpacto',
    focus: 'Extensores da coluna',
    description:
      'Deite de bruços e eleve simultaneamente braços e pernas do chão.',
    instructions: [
      'Deite de bruços com braços estendidos à frente',
      'Eleve braços e pernas simultaneamente',
      'Segure por 2-3 segundos',
      'Desça com controle',
    ],
    tips: [
      'Mantenha o olhar para o chão, evitando forçar o pescoço',
      'Ative os glúteos ao elevar',
    ],
    targetMuscles: ['Erector Spinae', 'Gluteus Maximus'],
  },
  {
    id: 'childPose',
    name: 'Postura da Criança',
    category: 'Costas',
    impact: 'Baixo',
    safetyLevel: 'mobilidade',
    focus: 'Relaxamento e alongamento',
    description:
      'Sente-se sobre os calcanhares e estenda os braços à frente no chão.',
    instructions: [
      'Ajoelhe-se no chão com joelhos afastados',
      'Sente-se sobre os calcanhares',
      'Estenda os braços à frente, testa no chão',
      'Respire profundamente por 30-60 segundos',
    ],
    tips: [
      'Use como exercício de recuperação entre séries',
      'Respire pelo nariz e solte pela boca',
    ],
    targetMuscles: ['Erector Spinae', 'Latissimus Dorsi'],
  },
];

// ─── Cache Management ───────────────────────────────────────

function getCache(): ExerciseDBCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache: ExerciseDBCache = JSON.parse(raw);
    const age = Date.now() - new Date(cache.lastUpdated).getTime();
    if (age > CACHE_TTL_MS) return null; // Expired
    return cache;
  } catch {
    return null;
  }
}

function setCache(exercises: ExerciseDBExercise[]): void {
  const cache: ExerciseDBCache = {
    lastUpdated: new Date().toISOString(),
    exercises,
  };
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn('Failed to cache ExerciseDB data:', e);
  }
}

// ─── API Fetching ───────────────────────────────────────────

async function fetchExercisesByBodyPart(
  bodyPart: string
): Promise<ExerciseDBExercise[]> {
  const res = await fetch(
    `${API_BASE}/exercises/bodyPart/${encodeURIComponent(bodyPart)}`,
    { signal: AbortSignal.timeout(10000) }
  );
  if (!res.ok) throw new Error(`API returned ${res.status}`);
  const data = await res.json();
  return data.data || data || [];
}

export async function fetchAndCacheExercises(): Promise<ExerciseDBExercise[]> {
  // Check cache first
  const cached = getCache();
  if (cached) return cached.exercises;

  try {
    const coreBodyParts = ['waist', 'back', 'upper legs'];
    const results = await Promise.all(
      coreBodyParts.map((part) => fetchExercisesByBodyPart(part))
    );

    const allExercises = results.flat();

    // Filter for body weight exercises
    const homeExercises = allExercises.filter(
      (ex) =>
        !ex.equipments ||
        ex.equipments.length === 0 ||
        ex.equipments.every((e) =>
          ['body weight', 'none', ''].includes(e.toLowerCase())
        )
    );

    setCache(homeExercises);
    return homeExercises;
  } catch (error) {
    console.warn('ExerciseDB API unavailable, using static data:', error);
    return [];
  }
}

// ─── Safety Classification ──────────────────────────────────

export function classifySafetyLevel(
  exercise: ExerciseDBExercise
): SafetyLevel {
  const nameLower = exercise.name.toLowerCase();
  const typeLower = (exercise.exerciseType || '').toLowerCase();

  // Mobility / Relief
  if (
    typeLower === 'flexibility' ||
    typeLower === 'stretching' ||
    nameLower.includes('stretch') ||
    nameLower.includes('cat') ||
    nameLower.includes('cow') ||
    nameLower.includes('child') ||
    nameLower.includes('yoga')
  ) {
    return 'mobilidade';
  }

  // Medium Impact — trunk flexion movements
  if (
    nameLower.includes('crunch') ||
    nameLower.includes('sit-up') ||
    nameLower.includes('sit up') ||
    nameLower.includes('v-up') ||
    nameLower.includes('leg raise') ||
    nameLower.includes('russian twist')
  ) {
    return 'medioImpacto';
  }

  // Default: Low Impact
  return 'baixoImpacto';
}

// ─── Exercise Accessors ─────────────────────────────────────

export function getStaticExerciseById(id: string): ExerciseDef | undefined {
  return STATIC_EXERCISES.find((ex) => ex.id === id);
}

export function getFilteredStaticExercises(
  painLevel: number
): ExerciseDef[] {
  if (painLevel >= 7) {
    return STATIC_EXERCISES.filter((ex) => ex.safetyLevel === 'mobilidade');
  }
  if (painLevel >= 4) {
    return STATIC_EXERCISES.filter(
      (ex) =>
        ex.safetyLevel === 'mobilidade' || ex.safetyLevel === 'baixoImpacto'
    );
  }
  return STATIC_EXERCISES;
}

export function getRandomTip(): { exerciseName: string; tip: string } | null {
  const exercisesWithTips = STATIC_EXERCISES.filter(
    (ex) => ex.tips && ex.tips.length > 0
  );
  if (exercisesWithTips.length === 0) return null;

  const randomEx =
    exercisesWithTips[Math.floor(Math.random() * exercisesWithTips.length)];
  const randomTip =
    randomEx.tips![Math.floor(Math.random() * randomEx.tips!.length)];

  return {
    exerciseName: randomEx.name,
    tip: randomTip,
  };
}

// ─── Radar Chart Data ───────────────────────────────────────

export function aggregateMuscleWork(
  sessions: { targetMuscles?: string[] }[]
): { muscle: string; value: number }[] {
  const muscleMap: Record<string, number> = {};
  sessions.forEach((s) => {
    (s.targetMuscles || []).forEach((m) => {
      muscleMap[m] = (muscleMap[m] || 0) + 1;
    });
  });

  const entries = Object.entries(muscleMap);
  if (entries.length === 0) return [];

  const maxVal = Math.max(...entries.map(([, v]) => v));
  return entries
    .map(([muscle, value]) => ({
      muscle,
      value: Math.round((value / maxVal) * 100),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8); // Top 8 muscles for radar
}
