import { IExerciseApiService } from '../../config/types';
import { ExternalSearchParams, ExternalSearchResult } from '../../types';
import { SEED_CATALOG } from '../../data/seedCatalog';
import { mockDelay } from './mockUtils';

export class MockExerciseApiService implements IExerciseApiService {
  async searchExternalExercises(
    params: ExternalSearchParams
  ): Promise<ExternalSearchResult> {
    await mockDelay(250);
    const q = (params.query || '').toLowerCase();
    const c = (params.category || '').toLowerCase();
    const m = (params.muscle || '').toLowerCase();

    const filtered = SEED_CATALOG.filter((ex) => {
      if (q && !ex.name.toLowerCase().includes(q)) return false;
      if (c && ex.category.toLowerCase() !== c) return false;
      if (m && !ex.primaryMuscles.some((pm) => pm.toLowerCase().includes(m))) {
        return false;
      }
      return true;
    }).slice(0, params.limit || 24);

    return {
      source: 'free-exercise-db',
      fallback: true,
      message: 'Modo offline/mock ativo — exibindo catálogo Free Exercise DB local.',
      exercises: filtered,
    };
  }

  clearCache(): void {
    // no-op
  }
}
