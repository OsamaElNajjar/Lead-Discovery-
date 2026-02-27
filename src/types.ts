export interface Lead {
  id: string;
  name: string;
  category: string;
  area: string;
  city: string;
  rating: number;
  reviews: number;
  phone: string;
  email: string;
  website: string;
  mapsUrl: string;
  leadScore: number;
  scoreReason: string;
  brief: string;
  marketingProblems: string[];
  outreachAngle: string;
  suggestedPackage: string;
}

export interface SearchFilters {
  industry: string;
  location: string;
  maxRating: number;
  minReviews?: number;
  mustHaveWebsite: boolean;
  mustHavePhone: boolean;
}
