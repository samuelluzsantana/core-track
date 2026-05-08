/**
 * Mock Exercise API Service
 * 
 * Returns static exercise data without hitting any external API.
 */

import { IExerciseApiService } from '../../config/types';
import { ExerciseDBExercise } from '../../types';
import { mockDelay, maybeThrow, mockLog } from './mockUtils';

/**
 * Expanded mock exercises that simulate what the real ExerciseDB API returns.
 */
const MOCK_EXERCISES: ExerciseDBExercise[] = [
  {
    exerciseId: 'mock-ex-001',
    name: 'Dead Bug',
    bodyParts: ['waist'],
    targetMuscles: ['abs'],
    secondaryMuscles: ['hip flexors'],
    exerciseType: 'strength',
    equipments: ['body weight'],
    instructions: [
      'Deite de costas com joelhos dobrados a 90°.',
      'Eleve os braços em direção ao teto.',
      'Estenda lentamente o braço direito e a perna esquerda.',
      'Retorne e repita com o lado oposto.',
    ],
    exerciseTips: ['Mantenha a lombar no chão.'],
    variations: [],
    relatedExerciseIds: [],
    overview: 'Excelente para estabilidade lombar.',
  },
  {
    exerciseId: 'mock-ex-002',
    name: 'Bird Dog',
    bodyParts: ['back', 'waist'],
    targetMuscles: ['spine', 'glutes'],
    secondaryMuscles: ['abs'],
    exerciseType: 'strength',
    equipments: ['body weight'],
    instructions: [
      'Posicione-se em 4 apoios.',
      'Estenda braço e perna opostos.',
      'Mantenha a coluna neutra.',
    ],
    exerciseTips: ['Não deixe o quadril rotacionar.'],
    variations: [],
    relatedExerciseIds: [],
    overview: 'Trabalha equilíbrio e extensores.',
  },
  {
    exerciseId: 'mock-ex-003',
    name: 'Glute Bridge',
    bodyParts: ['upper legs'],
    targetMuscles: ['glutes'],
    secondaryMuscles: ['hamstrings', 'abs'],
    exerciseType: 'strength',
    equipments: ['body weight'],
    instructions: [
      'Deite de costas com joelhos dobrados.',
      'Eleve o quadril contraindo glúteos.',
      'Segure por 2s no topo.',
    ],
    exerciseTips: ['Evite hiperestender a lombar.'],
    variations: ['Single Leg Glute Bridge'],
    relatedExerciseIds: [],
    overview: 'Fortalece cadeia posterior.',
  },
  {
    exerciseId: 'mock-ex-004',
    name: 'Cat Cow Stretch',
    bodyParts: ['back'],
    targetMuscles: ['spine'],
    secondaryMuscles: ['abs'],
    exerciseType: 'stretching',
    equipments: ['body weight'],
    instructions: [
      'Em 4 apoios, inspire arqueando as costas (Camelo).',
      'Expire arredondando as costas (Gato).',
      'Repita de forma fluida.',
    ],
    exerciseTips: ['Acompanhe a respiração.'],
    variations: [],
    relatedExerciseIds: [],
    overview: 'Mobilidade para a coluna.',
  },
  {
    exerciseId: 'mock-ex-005',
    name: 'Superman',
    bodyParts: ['back'],
    targetMuscles: ['spine', 'glutes'],
    secondaryMuscles: ['hamstrings'],
    exerciseType: 'strength',
    equipments: ['body weight'],
    instructions: [
      'Deite de bruços com braços estendidos.',
      'Eleve braços e pernas simultaneamente.',
      'Segure por 2-3 segundos.',
    ],
    exerciseTips: ['Mantenha o olhar para o chão.'],
    variations: [],
    relatedExerciseIds: [],
    overview: 'Fortalece extensores da coluna.',
  },
  {
    exerciseId: 'mock-ex-006',
    name: 'Crunch',
    bodyParts: ['waist'],
    targetMuscles: ['abs'],
    secondaryMuscles: ['obliques'],
    exerciseType: 'strength',
    equipments: ['body weight'],
    instructions: [
      'Deite com joelhos dobrados.',
      'Eleve os ombros do chão contraindo abdômen.',
      'Desça lentamente.',
    ],
    exerciseTips: ['Não puxe o pescoço.'],
    variations: ['Reverse Crunch', 'Bicycle Crunch'],
    relatedExerciseIds: [],
    overview: 'Isola o reto abdominal.',
  },
  {
    exerciseId: 'mock-ex-007',
    name: 'Child Pose',
    bodyParts: ['back'],
    targetMuscles: ['spine', 'lats'],
    secondaryMuscles: [],
    exerciseType: 'stretching',
    equipments: ['body weight'],
    instructions: [
      'Ajoelhe-se e sente sobre os calcanhares.',
      'Estenda os braços à frente.',
      'Respire profundamente por 30-60s.',
    ],
    exerciseTips: ['Ótimo para recuperação.'],
    variations: [],
    relatedExerciseIds: [],
    overview: 'Relaxamento e alongamento.',
  },
  {
    exerciseId: 'mock-ex-008',
    name: 'Plank',
    bodyParts: ['waist'],
    targetMuscles: ['abs'],
    secondaryMuscles: ['shoulders', 'glutes'],
    exerciseType: 'strength',
    equipments: ['body weight'],
    instructions: [
      'Apoie-se nos antebraços e ponta dos pés.',
      'Mantenha o corpo alinhado.',
      'Ative o core e segure.',
    ],
    exerciseTips: ['Não deixe o quadril cair.'],
    variations: ['Side Plank', 'Plank Up-Down'],
    relatedExerciseIds: [],
    overview: 'Exercício fundamental de estabilidade.',
  },
];

export class MockExerciseApiService implements IExerciseApiService {
  async fetchExercises(): Promise<ExerciseDBExercise[]> {
    await mockDelay(600); // Simulate API latency
    maybeThrow('fetchExercises');
    mockLog('ExerciseApi', 'fetchExercises', `returning ${MOCK_EXERCISES.length} exercises`);
    return [...MOCK_EXERCISES];
  }

  clearCache(): void {
    mockLog('ExerciseApi', 'clearCache (no-op in mock)');
  }
}
