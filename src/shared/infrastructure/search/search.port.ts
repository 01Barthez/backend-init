export type SearchHit = {
  id: string;
  score?: number;
};

export type SearchResult = {
  hits: SearchHit[];
  total: number;
};

export type SearchOptions = {
  limit?: number;
  skip?: number;
};

/**
 * Pluggable search index. Default adapter uses Mongo contains filters;
 * swap for Typesense/Meilisearch in product forks with heavy catalog search.
 */
export interface SearchPort {
  search(index: string, query: string, options?: SearchOptions): Promise<SearchResult>;
}
