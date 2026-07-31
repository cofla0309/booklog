export interface AladinItem {
  title: string;
  author: string;
  publisher: string;
  coverUrl: string;
  isbn13: string;
  totalPages: number | null;
  pubDate: string;
  category: string;
}

export interface AladinSearchResponse {
  items: AladinItem[];
  totalResults: number;
}

export interface AladinLookupResponse {
  item: AladinItem | null;
}
