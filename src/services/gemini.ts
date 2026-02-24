import { GoogleGenAI, Type, Modality } from "@google/genai";
import { GameState, GameOutcome, Choice, Attribute } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function generateInitialStory(lineageName: string, challenge: string): Promise<{ story: string, imagePrompt: string }> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Você é o narrador de um jogo de RPG medieval realista chamado "Vida Medieval". 
    O jogador escolheu a linhagem: ${lineageName}. 
    O desafio inicial é: ${challenge}.
    Escreva uma introdução imersiva em português para o primeiro dia de vida do jogador (ele tem 8 anos). 
    Foque no clima, no ambiente e na urgência do desafio. Seja dramático e realista.
    
    Também forneça um prompt em inglês para gerar uma imagem ilustrativa desta cena inicial. O prompt deve ser descritivo e focado no estilo artístico medieval realista.
    
    Responda em JSON com os campos "story" e "imagePrompt".`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          story: { type: Type.STRING },
          imagePrompt: { type: Type.STRING }
        },
        required: ["story", "imagePrompt"]
      }
    }
  });
  
  const result = JSON.parse(response.text || "{}");
  return {
    story: result.story || "A sua jornada começa...",
    imagePrompt: result.imagePrompt || "Medieval village scene, realistic art style"
  };
}

export async function generateImage(prompt: string): Promise<string | null> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `Realistic medieval art style, high detail, historical accuracy: ${prompt}`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        },
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64EncodeString: string = part.inlineData.data;
        return `data:image/png;base64,${base64EncodeString}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image Generation Error:", error);
    return null;
  }
}

export async function getGameOutcome(gameState: GameState, choice: Choice): Promise<GameOutcome> {
  const prompt = `
    Você é o Game Master de "Vida Medieval".
    Estado Atual:
    - Jogador: ${gameState.player.age} anos, Reino: ${gameState.player.kingdom}
    - Atributos: Saúde ${gameState.player.attributes.health}, Força ${gameState.player.attributes.strength}, Inteligência ${gameState.player.attributes.intelligence}, Riqueza ${gameState.player.attributes.wealth}, Honra ${gameState.player.attributes.honor}
    - Economia: ${gameState.player.currency.libras} libras, ${gameState.player.currency.sous} sous, ${gameState.player.currency.dinheiros} dinheiros
    - Inventário: ${gameState.player.inventory.join(", ")}
    - Sorte Atual: ${gameState.player.luck}/100
    - Clima: ${gameState.weather}
    - NPCs: ${gameState.npcs.map(n => `${n.name} (${n.role}, Status: ${n.status}, Afinidade: ${n.affinity})`).join(", ")}
    - História até agora: ${gameState.currentStory}
    - Escolha do Jogador: "${choice.text}"

    Gere o resultado desta escolha considerando os sistemas:
    1. Relacionamentos: Ações afetam afinidade. NPCs podem mudar de status.
    2. Saúde: Saúde baixa causa doenças. Lesões podem ser permanentes.
    3. Economia: Use dinheiros, sous e libras. Preços variam.
    4. Sorte: Sorte influencia o sucesso.
    5. Ambiente: O clima e o tempo (dias/semanas) devem avançar.
    6. Imagem: Forneça um prompt em inglês para uma imagem ilustrativa do resultado.

    Responda estritamente em JSON.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          story: { type: Type.STRING },
          attributeChanges: {
            type: Type.OBJECT,
            properties: {
              health: { type: Type.NUMBER },
              strength: { type: Type.NUMBER },
              intelligence: { type: Type.NUMBER },
              wealth: { type: Type.NUMBER },
              honor: { type: Type.NUMBER }
            }
          },
          npcChanges: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                status: { type: Type.STRING, enum: ["Vivo", "Morto", "Doente", "Desaparecido"] },
                relationship: { type: Type.STRING },
                affinityChange: { type: Type.NUMBER }
              }
            }
          },
          currencyChanges: {
            type: Type.OBJECT,
            properties: {
              dinheiros: { type: Type.NUMBER },
              sous: { type: Type.NUMBER },
              libras: { type: Type.NUMBER }
            }
          },
          inventoryChanges: {
            type: Type.OBJECT,
            properties: {
              add: { type: Type.ARRAY, items: { type: Type.STRING } },
              remove: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          },
          luckChange: { type: Type.NUMBER },
          weather: { type: Type.STRING },
          timePassedDays: { type: Type.NUMBER },
          newChoices: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                consequenceHint: { type: Type.STRING }
              }
            }
          },
          isGameOver: { type: Type.BOOLEAN },
          deathReason: { type: Type.STRING },
          criticalWarning: { type: Type.STRING },
          imagePrompt: { type: Type.STRING }
        },
        required: ["story", "attributeChanges", "npcChanges", "timePassedDays", "newChoices", "isGameOver", "imagePrompt"]
      }
    }
  });

  return JSON.parse(response.text || "{}") as GameOutcome;
}

export async function speakText(text: string): Promise<string | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Narre com uma voz solene e medieval: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Charon' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio ? `data:audio/mp3;base64,${base64Audio}` : null;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
}
