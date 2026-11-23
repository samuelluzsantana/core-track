import { IExerciseApiService } from '../../config/types';
import {
  CatalogExercise,
  ExerciseCategory,
  ExternalSearchParams,
  ExternalSearchResult,
  ImpactLevel,
  MeasurementType,
} from '../../types';
import { supabase } from '../../utils/supabase';
import { SEED_CATALOG } from '../../data/seedCatalog';

const FREE_DB_URL =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const FREE_DB_IMG_BASE =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';
const CACHE_KEY = 'coretracker_free_ex_db_v2';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface FreeDbRaw {
  id: string;
  name: string;
  force: 'static' | 'push' | 'pull' | null;
  level: 'beginner' | 'intermediate' | 'expert';
  mechanic: 'compound' | 'isolation' | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string;
  images: string[];
}

let inMemoryFreeDb: CatalogExercise[] | null = null;

function inferMeasurementType(
  name: string,
  category: ExerciseCategory,
  force?: string | null
): MeasurementType {
  const n = name.toLowerCase();
  if (
    n.includes('hiit') ||
    n.includes('tabata') ||
    n.includes('interval') ||
    n.includes('sprint') ||
    n.includes('burpee') ||
    n.includes('jumping') ||
    n.includes('star jump') ||
    n.includes('skipping')
  ) {
    return 'interval_based';
  }
  if (
    n.includes('plank') ||
    n.includes('hold') ||
    n.includes('rope') ||
    n.includes('stretch') ||
    n.includes('pose') ||
    category === 'cardio' ||
    category === 'stretching' ||
    category === 'mobility' ||
    force === 'static'
  ) {
    return 'time_based';
  }
  return 'reps_based';
}

function inferImpact(name: string, category: ExerciseCategory): ImpactLevel {
  const n = name.toLowerCase();
  if (
    category === 'stretching' ||
    category === 'mobility' ||
    n.includes('stretch') ||
    n.includes('pose') ||
    n.includes('cat')
  ) {
    return 'mobility';
  }
  if (
    category === 'plyometrics' ||
    n.includes('jump') ||
    n.includes('rope') ||
    n.includes('sprint') ||
    n.includes('burpee') ||
    n.includes('skipping')
  ) {
    return 'high';
  }
  if (
    n.includes('crunch') ||
    n.includes('sit-up') ||
    n.includes('twist') ||
    n.includes('climber') ||
    n.includes('superman')
  ) {
    return 'medium';
  }
  return 'low';
}

function mapCategory(raw: string | undefined, muscles: string[]): ExerciseCategory {
  const c = (raw || '').toLowerCase();
  if (c === 'cardio' || c === 'conditioning') return 'cardio';
  if (c === 'plyometrics') return 'plyometrics';
  if (c === 'stretching') return 'stretching';
  if (c === 'mobility' || c === 'yoga' || c === 'physical_therapy') return 'mobility';
  if (
    muscles.some((m) =>
      ['abdominals', 'abs', 'lower back', 'core'].includes(m.toLowerCase())
    )
  ) {
    return 'core';
  }
  return 'strength';
}

function normalizeFreeDbItem(item: FreeDbRaw): CatalogExercise {
  const category = mapCategory(item.category, item.primaryMuscles || []);
  const measurementType = inferMeasurementType(item.name, category, item.force);
  const themeColor =
    category === 'cardio' || measurementType === 'interval_based'
      ? 'indigo'
      : measurementType === 'time_based'
        ? category === 'mobility'
          ? 'emerald'
          : 'amber'
        : 'teal';

  return {
    id: `fedb-${item.id}`,
    externalId: item.id,
    source: 'free-exercise-db',
    name: item.name,
    category,
    measurementType,
    force: item.force,
    level: item.level || 'beginner',
    mechanic: item.mechanic,
    equipment: item.equipment || 'body only',
    primaryMuscles: item.primaryMuscles || [],
    secondaryMuscles: item.secondaryMuscles || [],
    instructions: item.instructions || [],
    tips: [],
    imageUrls: (item.images || []).map((img) => `${FREE_DB_IMG_BASE}/${img}`),
    impactLevel: inferImpact(item.name, category),
    themeColor,
    iconName:
      measurementType === 'interval_based'
        ? 'zap'
        : measurementType === 'time_based'
          ? 'timer'
          : 'dumbbell',
    defaultConfig:
      measurementType === 'time_based'
        ? { targetSeconds: 45 }
        : measurementType === 'interval_based'
          ? { rounds: 4, workSeconds: 30, restSeconds: 15, targetCycles: 30 }
          : { defaultSets: 3, defaultReps: 12, defaultLoadKg: 0 },
    isCustom: false,
  };
}

function normalizeServerExercise(item: any): CatalogExercise {
  const category = (item.category || 'strength') as ExerciseCategory;
  const measurementType = (item.measurement_type || 'reps_based') as MeasurementType;
  return {
    id: `ext-${item.source}-${item.external_id}`,
    externalId: item.external_id,
    source: item.source,
    name: item.name,
    category,
    measurementType,
    force: item.force ?? null,
    level: item.level || 'beginner',
    mechanic: item.mechanic ?? null,
    equipment: item.equipment ?? 'body only',
    primaryMuscles: item.primary_muscles || [],
    secondaryMuscles: item.secondary_muscles || [],
    instructions: item.instructions || [],
    tips: [],
    imageUrls: item.image_urls || [],
    impactLevel: item.impact_level || 'low',
    themeColor:
      category === 'cardio' || measurementType === 'interval_based'
        ? 'indigo'
        : measurementType === 'time_based'
          ? 'amber'
          : 'teal',
    iconName:
      measurementType === 'interval_based'
        ? 'zap'
        : measurementType === 'time_based'
          ? 'timer'
          : 'dumbbell',
    defaultConfig:
      measurementType === 'time_based'
        ? { targetSeconds: 45 }
        : measurementType === 'interval_based'
          ? { rounds: 4, workSeconds: 30, restSeconds: 15, targetCycles: 30 }
          : { defaultSets: 3, defaultReps: 12, defaultLoadKg: 0 },
    isCustom: false,
  };
}

export class RealExerciseApiService implements IExerciseApiService {
  private async loadFreeExerciseDb(): Promise<CatalogExercise[]> {
    if (inMemoryFreeDb) return inMemoryFreeDb;

    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as { ts: number; items: CatalogExercise[] };
        if (Date.now() - parsed.ts < CACHE_TTL_MS && Array.isArray(parsed.items)) {
          inMemoryFreeDb = parsed.items;
          return inMemoryFreeDb;
        }
      }
    } catch {
      // ignore invalid cache
    }

    try {
      const res = await fetch(FREE_DB_URL, { signal: AbortSignal.timeout(12000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = (await res.json()) as FreeDbRaw[];
      const normalized = raw.map(normalizeFreeDbItem);
      inMemoryFreeDb = normalized;
      try {
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ ts: Date.now(), items: normalized.slice(0, 350) })
        );
      } catch {
        // storage quota full — keep in memory
      }
      return normalized;
    } catch {
      return SEED_CATALOG;
    }
  }

  async searchExternalExercises(
    params: ExternalSearchParams
  ): Promise<ExternalSearchResult> {
    const query = (params.query || '').trim();
    const category = (params.category || '').trim();
    const muscle = (params.muscle || '').trim();
    const difficulty = (params.difficulty || '').trim();
    const provider = params.provider || 'auto';
    const limit = params.limit || 24;

    // 1. Try backend proxy (/api/exercises on Vercel) or Supabase Edge Function when requesting api-ninjas / exerciseapi / auto
    if (provider !== 'free-exercise-db') {
      try {
        const qs = new URLSearchParams();
        if (query) qs.set('name', query);
        if (category) qs.set('type', category);
        if (muscle) qs.set('muscle', muscle);
        if (difficulty) qs.set('difficulty', difficulty);
        qs.set('provider', provider);
        qs.set('limit', String(limit));

        const apiRes = await fetch(`/api/exercises?${qs.toString()}`, {
          signal: AbortSignal.timeout(6000),
        });
        if (apiRes.ok) {
          const ct = apiRes.headers.get('content-type') || '';
          if (ct.includes('application/json')) {
            const payload = await apiRes.json();
            if (Array.isArray(payload.data) && payload.data.length > 0) {
              return {
                source: payload.source || 'free-exercise-db',
                fallback: Boolean(payload.fallback),
                message: payload.message,
                exercises: payload.data.map(normalizeServerExercise),
              };
            }
          }
        }
      } catch {
        // Fallback to Supabase Edge Function or direct Free Exercise DB
      }

      try {
        const { data, error } = await supabase.functions.invoke('exercises-search', {
          body: { name: query, type: category, muscle, difficulty, provider, limit },
        });
        if (!error && data && Array.isArray(data.data) && data.data.length > 0) {
          return {
            source: data.source || 'free-exercise-db',
            fallback: Boolean(data.fallback),
            message: data.message,
            exercises: data.data.map(normalizeServerExercise),
          };
        }
      } catch {
        // Continue to client-side Free Exercise DB fallback
      }
    }

    // 2. Direct Free Exercise DB open catalog fallback (zero rate-limit, 876 exercises + images)
    const allFree = await this.loadFreeExerciseDb();
    const q = query.toLowerCase();
    const m = muscle.toLowerCase();
    const c = category.toLowerCase();
    const d = difficulty.toLowerCase();

    const filtered = allFree
      .filter((item) => {
        if (
          q &&
          !item.name.toLowerCase().includes(q) &&
          !item.primaryMuscles.some((pm) => pm.toLowerCase().includes(q)) &&
          !(item.equipment || '').toLowerCase().includes(q)
        ) {
          return false;
        }
        if (m && !item.primaryMuscles.some((pm) => pm.toLowerCase().includes(m))) {
          return false;
        }
        if (c && item.category.toLowerCase() !== c) {
          return false;
        }
        if (d && item.level.toLowerCase() !== d) {
          return false;
        }
        return true;
      })
      .slice(0, limit);

    return {
      source: 'free-exercise-db',
      fallback: provider === 'api-ninjas' || provider === 'exerciseapi',
      message:
        provider === 'api-ninjas'
          ? 'API_NINJAS_KEY não configurada no servidor — exibindo resultados do Free Exercise DB.'
          : undefined,
      exercises: filtered,
    };
  }

  clearCache(): void {
    inMemoryFreeDb = null;
    localStorage.removeItem(CACHE_KEY);
  }
}
