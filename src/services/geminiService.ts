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
      contents: `Retrieve the lyrics for "${songName}" by "${artist}". 
      
      RULES:
      1. Provide ONLY Romanized (Latin script) lyrics.
      2. Do NOT translate the meaning.
      3. Use strictly one line of Romanized text per line of original lyrics.
      4. Ensure accurate line-breaks between verses and chorus for high readability.
      5. Do not include any headers like [Verse 1] or [Chorus].`,
      config: {
        systemInstruction: "You are a professional music transliteration engine. You convert Indian language songs (Hindi, Punjabi, etc.) into Roman script (English letters) while preserving the exact rhythmic structure and line breaks of the original song. Never translate; only transliterate."
      }
    });

    return response.text || "Lyrics not found.";
  }
};
