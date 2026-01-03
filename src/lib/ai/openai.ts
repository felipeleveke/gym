import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

export async function generateExerciseDescription(exerciseName: string): Promise<string> {
  const client = getOpenAIClient();
  
  const response = await client.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'Eres un experto en fitness y entrenamiento. Proporciona descripciones claras y técnicas de ejercicios.',
      },
      {
        role: 'user',
        content: `Proporciona una descripción detallada de cómo realizar el ejercicio: ${exerciseName}. Incluye técnica correcta, músculos trabajados y precauciones.`,
      },
    ],
    max_tokens: 300,
  });

  return response.choices[0]?.message?.content || 'No se pudo generar la descripción';
}

export async function suggestExerciseVariations(exerciseName: string): Promise<string[]> {
  const client = getOpenAIClient();
  
  const response = await client.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'Eres un experto en fitness. Proporciona variaciones de ejercicios en formato JSON array.',
      },
      {
        role: 'user',
        content: `Proporciona 5 variaciones del ejercicio ${exerciseName} en formato JSON array de strings.`,
      },
    ],
    max_tokens: 200,
    response_format: { type: 'json_object' },
  });

  try {
    const content = response.choices[0]?.message?.content;
    if (content) {
      const parsed = JSON.parse(content);
      return parsed.variations || parsed.exercises || [];
    }
  } catch (error) {
    console.error('Error parsing OpenAI response:', error);
  }

  return [];
}

export async function parseTrainingProgram(text: string): Promise<any> {
  const client = getOpenAIClient();

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `Parse training program into ULTRA-COMPRESSED JSON using TEMPLATE REFERENCES.
        
        Key Insight: Many weeks repeat the same routines. Define each UNIQUE routine ONCE, then reference by ID.
        
        Output Structure:
        {
          "n": "Program Name",
          "g": "Goal",
          "t": { // Templates (unique routines)
            "t1": {"n": "Legs", "d": "Mon", "e": [["Squat", 3, 10, 12, 65, null]]},
            "t2": {"n": "Chest", "d": "Wed", "e": [["Bench Press", 3, 10, 12, 65, null]]}
          },
          "b": [ // Blocks
            {
              "n": "Adaptation",
              "w": 3, // duration_weeks
              "s": [ // Schedule (week -> template IDs)
                {"w": [1, 2], "r": ["t1", "t2"]}, // Weeks 1-2 use templates t1, t2
                {"w": [3], "r": ["t1", "t2"]} // Week 3 uses same
              ]
            }
          ]
        }
        
        Template Format:
        - "n": Routine name
        - "d": Day (Mon/Tue/Wed/Thu/Fri/Sat/Sun)
        - "e": Exercises as arrays [Name, Sets, RepsMin, RepsMax, Weight%, RPE]
        
        Rules:
        1. Identify UNIQUE routines across all weeks. Give each a template ID (t1, t2, ...).
        2. If Week 1 Monday = Week 2 Monday = Week 3 Monday, define it ONCE as a template.
        3. In schedule "s", map week numbers to template IDs.
        4. Be EXTREMELY aggressive with deduplication.
        `,
      },
      {
        role: 'user',
        content: `Parse:\n\n${text}`,
      },
    ],
    temperature: 0.1,
    max_tokens: 4096,
    response_format: { type: 'json_object' },
  });

  try {
    const content = response.choices[0]?.message?.content;
    if (content) {
      return JSON.parse(content);
    }
  } catch (error) {
    console.error('Error parsing OpenAI response:', error);
    console.error('Partial content:', response.choices[0]?.message?.content?.slice(0, 200) + '...');
  }

  return null;
}

