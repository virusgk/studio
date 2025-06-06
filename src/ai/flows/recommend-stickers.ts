// src/ai/flows/recommend-stickers.ts
'use server';

/**
 * @fileOverview A sticker recommendation AI agent.
 *
 * - recommendStickers - A function that recommends stickers based on cart items.
 * - RecommendStickersInput - The input type for the recommendStickers function.
 * - RecommendStickersOutput - The return type for the recommendStickers function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendStickersInputSchema = z.object({
  cartItems: z
    .array(z.string())
    .describe('An array of names/descriptions of stickers currently in the user cart.'),
});
export type RecommendStickersInput = z.infer<typeof RecommendStickersInputSchema>;

const RecommendStickersOutputSchema = z.object({
  recommendations: z
    .array(z.string())
    .describe('An array of recommended sticker names/descriptions based on the cart items.'),
});
export type RecommendStickersOutput = z.infer<typeof RecommendStickersOutputSchema>;

export async function recommendStickers(input: RecommendStickersInput): Promise<RecommendStickersOutput> {
  return recommendStickersFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendStickersPrompt',
  input: {schema: RecommendStickersInputSchema},
  output: {schema: RecommendStickersOutputSchema},
  prompt: `You are a sticker recommendation expert.

  Based on the stickers currently in the user's cart, recommend other stickers that the user might like.
  Return an array of sticker names/descriptions.

  Current cart items: {{#each cartItems}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
  `,
});

const recommendStickersFlow = ai.defineFlow(
  {
    name: 'recommendStickersFlow',
    inputSchema: RecommendStickersInputSchema,
    outputSchema: RecommendStickersOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
