import type { IncomingMessage, ServerResponse } from 'http';

interface NormalizedExternalExercise {
  external_id: string;
  source: 'api-ninjas' | 'exerciseapi' | 'free-exercise-db';
  name: string;
  category: 'core' | 'cardio' | 'strength' | 'mobility' | 'stretching' | 'plyometrics';
  measurement_type: 'time_based' | 'reps_based' | 'interval_based';
  force: 'static' | 'push' | 'pull' | null;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  mechanic: 'compound' | 'isolation' | null;
  equipment: string | null;
  primary_muscles: string[];
  secondary_muscles: string[];
  instructions: string[];
  image_urls: string[];
  impact_level: 'mobility' | 'low' | 'medium' | 'high';
}

function inferMeasurementType(
  name: string,
  category: string,
  force?: string | null
): NormalizedExternalExercise['measurement_type'] {
  const n = name.toLowerCase();
  const c = category.toLowerCase();
  if (
    n.includes('hiit') ||
    n.includes('tabata') ||
    n.includes('interval') ||
    n.includes('sprint') ||
    n.includes('burpee') ||
    n.includes('jumping jack') ||
    n.includes('star jump')
  ) {
    return 'interval_based';
  }
  if (
    n.includes('plank') ||
    n.includes('hold') ||
    n.includes('rope') ||
    n.includes('stretch') ||
    n.includes('pose') ||
    c === 'cardio' ||
    c === 'stretching' ||
    c === 'mobility' ||
    force === 'static'
  ) {
    return 'time_based';
  }
  return 'reps_based';
}

function inferImpactLevel(
  name: string,
  category: string
): NormalizedExternalExercise['impact_level'] {
  const n = name.toLowerCase();
  const c = category.toLowerCase();
  if (
    c === 'stretching' ||
    c === 'mobility' ||
    n.includes('stretch') ||
    n.includes('pose') ||
    n.includes('cat') ||
    n.includes('mobility')
  ) {
    return 'mobility';
  }
  if (
    c === 'plyometrics' ||
    n.includes('jump') ||
    n.includes('rope') ||
    n.includes('sprint') ||
    n.includes('burpee') ||
    n.includes('jack') ||
    n.includes('hop')
  ) {
    return 'high';
  }
  if (
    n.includes('crunch') ||
    n.includes('sit-up') ||
    n.includes('twist') ||
    n.includes('climber') ||
    n.includes('superman') ||
    n.includes('v-up')
  ) {
    return 'medium';
  }
  return 'low';
}

function mapCategory(
  raw: string | undefined,
  muscles: string[]
): NormalizedExternalExercise['category'] {
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

export default async function handler(
  req: IncomingMessage & { query?: Record<string, string | string[]> },
  res: ServerResponse & { status?: (code: number) => unknown; json?: (body: unknown) => void }
) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end('');
    return;
  }

  try {
    const reqUrl = new URL(req.url || '/api/exercises', 'https://localhost');
    const name = (reqUrl.searchParams.get('name') || reqUrl.searchParams.get('q') || '').trim();
    const type = (reqUrl.searchParams.get('type') || reqUrl.searchParams.get('category') || '').trim();
    const muscle = (reqUrl.searchParams.get('muscle') || '').trim();
    const difficulty = (reqUrl.searchParams.get('difficulty') || reqUrl.searchParams.get('level') || '').trim();
    const provider = (reqUrl.searchParams.get('provider') || 'auto').trim();
    const limit = Math.min(Number(reqUrl.searchParams.get('limit') || 24), 50);

    const apiNinjasKey = process.env.API_NINJAS_KEY;
    const exerciseApiKey = process.env.EXERCISE_API_KEY;

    // 1. API Ninjas Exercises endpoint
    if ((provider === 'api-ninjas' || provider === 'auto') && apiNinjasKey) {
      const ninjaUrl = new URL('https://api.api-ninjas.com/v1/exercises');
      if (name) ninjaUrl.searchParams.set('name', name);
      if (type) ninjaUrl.searchParams.set('type', type);
      if (muscle) ninjaUrl.searchParams.set('muscle', muscle);
      if (difficulty) ninjaUrl.searchParams.set('difficulty', difficulty);

      const ninjaRes = await fetch(ninjaUrl.toString(), {
        headers: { 'X-Api-Key': apiNinjasKey },
        signal: AbortSignal.timeout(8000),
      });

      if (ninjaRes.ok) {
        const items = (await ninjaRes.json()) as Array<{
          name: string;
          type: string;
          muscle: string;
          equipment: string;
          difficulty: string;
          instructions: string;
        }>;

        const normalized: NormalizedExternalExercise[] = items
          .slice(0, limit)
          .map((item, idx) => {
            const muscles = item.muscle ? [item.muscle] : [];
            const cat = mapCategory(item.type, muscles);
            return {
              external_id: `ninjas_${item.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${idx}`,
              source: 'api-ninjas',
              name: item.name,
              category: cat,
              measurement_type: inferMeasurementType(item.name, cat),
              force: null,
              level: (['beginner', 'intermediate', 'expert'].includes(item.difficulty)
                ? item.difficulty
                : 'beginner') as NormalizedExternalExercise['level'],
              mechanic: null,
              equipment: item.equipment || 'body only',
              primary_muscles: muscles,
              secondary_muscles: [],
              instructions: item.instructions
                ? item.instructions.split(/(?<=\.)\s+/).filter(Boolean)
                : [],
              image_urls: [],
              impact_level: inferImpactLevel(item.name, cat),
            };
          });

        if (normalized.length > 0) {
          res.statusCode = 200;
          res.end(JSON.stringify({ source: 'api-ninjas', fallback: false, data: normalized }));
          return;
        }
      }
    }

    // 2. ExerciseAPI endpoint (if EXERCISE_API_KEY is configured)
    if ((provider === 'exerciseapi' || provider === 'auto') && exerciseApiKey) {
      const exUrl = new URL('https://api.exerciseapi.dev/v1/exercises');
      if (name) exUrl.searchParams.set('q', name);
      if (muscle) exUrl.searchParams.set('muscle', muscle);
      if (difficulty) exUrl.searchParams.set('level', difficulty);
      exUrl.searchParams.set('limit', String(limit));

      const exRes = await fetch(exUrl.toString(), {
        headers: { 'X-API-Key': exerciseApiKey },
        signal: AbortSignal.timeout(8000),
      });

      if (exRes.ok) {
        const payload = await exRes.json();
        const items = (payload.data || []) as Array<Record<string, unknown>>;
        const normalized: NormalizedExternalExercise[] = items.map((item) => {
          const pm = (item.primaryMuscles as string[]) || [];
          const cat = mapCategory(item.category as string, pm);
          const imgs = ((item.images as string[]) || []).map((p) =>
            p.startsWith('http')
              ? p
              : `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${p}`
          );
          return {
            external_id: String(item.id || item.name),
            source: 'exerciseapi',
            name: String(item.name),
            category: cat,
            measurement_type: inferMeasurementType(
              String(item.name),
              cat,
              item.force as string | null
            ),
            force: (item.force as NormalizedExternalExercise['force']) || null,
            level: (item.level as NormalizedExternalExercise['level']) || 'beginner',
            mechanic: (item.mechanic as NormalizedExternalExercise['mechanic']) || null,
            equipment: (item.equipment as string | null) || null,
            primary_muscles: pm,
            secondary_muscles: (item.secondaryMuscles as string[]) || [],
            instructions: (item.instructions as string[]) || [],
            image_urls: imgs,
            impact_level: inferImpactLevel(String(item.name), cat),
          };
        });

        if (normalized.length > 0) {
          res.statusCode = 200;
          res.end(JSON.stringify({ source: 'exerciseapi', fallback: false, data: normalized }));
          return;
        }
      }
    }

    // 3. Graceful fallback to Free Exercise DB open JSON dataset
    const freeRes = await fetch(
      'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json',
      { signal: AbortSignal.timeout(10000) }
    );
    if (!freeRes.ok) {
      throw new Error(`Free Exercise DB returned ${freeRes.status}`);
    }

    const freeItems = (await freeRes.json()) as Array<{
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
    }>;

    const q = name.toLowerCase();
    const m = muscle.toLowerCase();
    const t = type.toLowerCase();
    const d = difficulty.toLowerCase();

    const filtered = freeItems
      .filter((item) => {
        if (
          q &&
          !item.name.toLowerCase().includes(q) &&
          !item.primaryMuscles.some((pm) => pm.toLowerCase().includes(q))
        ) {
          return false;
        }
        if (m && !item.primaryMuscles.some((pm) => pm.toLowerCase().includes(m))) {
          return false;
        }
        if (t) {
          const cat = mapCategory(item.category, item.primaryMuscles);
          if (cat !== t && item.category.toLowerCase() !== t) return false;
        }
        if (d && item.level.toLowerCase() !== d) return false;
        return true;
      })
      .slice(0, limit)
      .map((item): NormalizedExternalExercise => {
        const cat = mapCategory(item.category, item.primaryMuscles);
        return {
          external_id: item.id,
          source: 'free-exercise-db',
          name: item.name,
          category: cat,
          measurement_type: inferMeasurementType(item.name, cat, item.force),
          force: item.force,
          level: item.level || 'beginner',
          mechanic: item.mechanic,
          equipment: item.equipment,
          primary_muscles: item.primaryMuscles || [],
          secondary_muscles: item.secondaryMuscles || [],
          instructions: item.instructions || [],
          image_urls: (item.images || []).map(
            (img) =>
              `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${img}`
          ),
          impact_level: inferImpactLevel(item.name, cat),
        };
      });

    res.statusCode = 200;
    res.end(
      JSON.stringify({
        source: 'free-exercise-db',
        fallback: !apiNinjasKey,
        message: !apiNinjasKey
          ? 'API_NINJAS_KEY não configurada; utilizando catálogo Free Exercise DB.'
          : undefined,
        data: filtered,
      })
    );
  } catch (err) {
    res.statusCode = 500;
    res.end(
      JSON.stringify({
        error: err instanceof Error ? err.message : 'Internal server error',
        data: [],
      })
    );
  }
}
