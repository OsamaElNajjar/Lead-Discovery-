import { GoogleGenAI, Modality } from "@google/genai";
import { Lead, SearchFilters } from "../types";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

const SAMPLE_LEADS: Lead[] = [
  {
    id: "1",
    name: "Elite Dental Care Dubai",
    category: "Dental Clinic",
    area: "Business Bay",
    city: "Dubai",
    rating: 3.8,
    reviews: 42,
    phone: "+971 4 123 4567",
    email: "Not found",
    website: "https://elitedentaldubai.example.com",
    mapsUrl: "https://maps.google.com",
    leadScore: 88,
    scoreReason: "Low rating (3.8) despite being in high-value Business Bay area. Significant reputation management opportunity.",
    brief: "A premium-positioned dental clinic that seems to be struggling with patient satisfaction and follow-up care based on recent reviews.",
    marketingProblems: ["Poor Reputation", "Weak Local SEO", "No Patient Follow-up"],
    outreachAngle: "Reputation recovery and automated patient feedback systems.",
    suggestedPackage: "Reputation + Local SEO"
  },
  {
    id: "2",
    name: "Smile Bright Clinic",
    category: "Dental Clinic",
    area: "Dubai Marina",
    city: "Dubai",
    rating: 3.5,
    reviews: 15,
    phone: "+971 4 987 6543",
    email: "info@smilebright.example.com",
    website: "Not found",
    mapsUrl: "https://maps.google.com",
    leadScore: 95,
    scoreReason: "No website and very low rating (3.5). High-value location with zero digital presence.",
    brief: "A small clinic in a high-traffic area with no website and poor reviews. They are likely losing 70% of potential digital leads.",
    marketingProblems: ["No Website", "Low Rating", "Zero Social Presence"],
    outreachAngle: "Full digital transformation: Website + Google Maps Optimization.",
    suggestedPackage: "The Growth Starter"
  }
];

export const searchLeads = async (filters: SearchFilters): Promise<{ leads: Lead[]; rawResponse: string }> => {
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  
  // For demo purposes, we can return sample data if the search is for the specific example
  if (filters.industry.toLowerCase().includes("dental") && filters.location.toLowerCase().includes("dubai")) {
    // We still try the real call, but if it's a demo we might want to ensure success
  }

  const prompt = `
    Find businesses in the UAE for the following criteria:
    Industry: ${filters.industry}
    Location: ${filters.location}
    
    Filters to apply:
    - Max Rating: ${filters.maxRating}
    - Min Reviews: ${filters.minReviews || 0}
    - Must have website: ${filters.mustHaveWebsite}
    - Must have phone: ${filters.mustHavePhone}
    
    For each business found, provide:
    1. Name
    2. Category
    3. Area/City
    4. Rating & Review Count
    5. Phone & Website (if available)
    6. A brief 2-3 line summary of what they do.
    7. A Lead Score (0-100) based on marketing opportunity (higher score for lower ratings, weak online presence).
    8. Top 3 marketing problems.
    9. Best outreach angle.
    10. Suggested service package.
    
    IMPORTANT: Return the results as a JSON array of objects matching this structure:
    {
      "id": string (unique identifier),
      "name": string,
      "category": string,
      "area": string,
      "city": string,
      "rating": number,
      "reviews": number,
      "phone": string,
      "email": string (search for public email or return "Not found"),
      "website": string,
      "mapsUrl": string,
      "leadScore": number,
      "scoreReason": string,
      "brief": string,
      "marketingProblems": string[],
      "outreachAngle": string,
      "suggestedPackage": string
    }
    
    Wrap the JSON array in \`\`\`json blocks.
    If you cannot find real data, please provide 5-10 realistic sample businesses for the UAE market and label them as "Sample Output".
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
      },
    });

    const text = response.text || "";
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    
    if (jsonMatch && jsonMatch[1]) {
      try {
        const leads = JSON.parse(jsonMatch[1]);
        return { leads, rawResponse: text };
      } catch (e) {
        console.error("Failed to parse JSON from Gemini", e);
      }
    }

    // Fallback to sample data if parsing fails or no results
    return { leads: SAMPLE_LEADS, rawResponse: "Showing Sample Output Structure\n\n" + text };
  } catch (error) {
    console.error("Error searching leads:", error);
    return { leads: SAMPLE_LEADS, rawResponse: "API Error. Showing Sample Output Structure." };
  }
};

export const editMarketingImage = async (base64Image: string, prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image.split(',')[1] || base64Image,
              mimeType: "image/png",
            },
          },
          {
            text: `Edit this marketing image: ${prompt}. Return only the edited image.`,
          },
        ],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image returned from Gemini");
  } catch (error) {
    console.error("Error editing image:", error);
    throw error;
  }
};
