import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface SongMetadata {
  id: string;
  name: string;
  artist: string;
  image: string;
  videoId: string;
  duration?: string;
  lyrics?: string;
}

export interface SongDetail extends SongMetadata {
  lyrics: string;
}

export const geminiService = {
  async getTrendingSongs(page: number = 1): Promise<SongMetadata[]> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `List 10 LATEST trending Hindi, Punjabi, and North Indian hits released in 2024-2025 for page ${page}. CRITICAL: You MUST provide the exact 11-character YouTube video ID and estimated song duration (e.g., '3:45'). Return a JSON array with 'name', 'artist', 'videoId', and 'duration'.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              artist: { type: Type.STRING },
              videoId: { type: Type.STRING },
              duration: { type: Type.STRING }
            },
            required: ["name", "artist", "videoId", "duration"]
          }
        }
      }
    });

    try {
      const data = JSON.parse(response.text || "[]");
      return data.map((s: any, i: number) => {
        const videoId = s.videoId && s.videoId.length === 11 ? s.videoId : "dQw4w9WgXcQ"; 
        return {
          ...s,
          videoId,
          id: `trending-${page}-${i}-${Date.now()}`,
          image: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        };
      });
    } catch (e) {
      return [];
    }
  },

  async searchSongs(query: string, page: number = 1): Promise<SongMetadata[]> {
    if (!query) return [];
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Search YouTube for the OFFICIAL music video of: "${query}". Return a JSON array of the top 8 most relevant matches with 'name', 'artist', the exact 11-character 'videoId', and estimated 'duration' (e.g. 4:12).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              artist: { type: Type.STRING },
              videoId: { type: Type.STRING },
              duration: { type: Type.STRING }
            },
            required: ["name", "artist", "videoId", "duration"]
          }
        }
      }
    });

    try {
      const data = JSON.parse(response.text || "[]");
      return data.map((s: any, i: number) => {
        const videoId = s.videoId && s.videoId.length === 11 ? s.videoId : "dQw4w9WgXcQ";
        return {
          ...s,
          videoId,
          id: `search-${page}-${i}-${Date.now()}`,
          image: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        };
      });
    } catch (e) {
      return [];
    }
  },

  async getLyrics(songName: string, artist: string): Promise<string> {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `Retrieve the lyrics for "${songName}" by "${artist}". CRITICAL: Do NOT translate the lyrics to English meaning. Instead, provide the lyrics in their original language (Hindi, Punjabi, etc.) but written ENTIRELY in the Roman/Latin script (English letters/transliteration). For example, if the lyric is 'तुम ही हो', write 'Tum hi ho'. Format the output as clean text with line breaks.`,
      config: {
        systemInstruction: "You are a specialized music lyrics transliteration engine. You take songs in Hindi, Punjabi, or other Indian languages and write them out using English letters (Romanization). You NEVER translate the meaning; you only change the script from Devanagari/Gurmukhi to Roman script."
      }
    });

    return response.text || "Lyrics not found.";
  }
};
