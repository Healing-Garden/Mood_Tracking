export interface SearchResult {
  entry_id: string;
  text: string;
  similarity: number;
  mood?: string;
  created_at: string;
  highlighted_text?: string;
}

export interface SemanticSearchResponse {
  success: boolean;
  data: {
    results: SearchResult[];
    searchType: string;
  };
}