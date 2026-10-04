export type VectorDistanceMetric = 'cosine' | 'euclidean' | 'dot_product';

export interface VectorRecord<T = Record<string, any>> {
  id: string;
  vector: number[];
  metadata?: T;
  timestamp?: number;
  author?: string;
}

export interface SearchOptions {
  topK?: number;
  metric?: VectorDistanceMetric;
  filter?: (metadata: Record<string, any>) => boolean;
  efSearch?: number;
}

export interface SimilarityResult<T = Record<string, any>> {
  id: string;
  score: number;
  metadata: T;
}
