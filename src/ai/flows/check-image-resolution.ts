'use server';

/**
 * @fileOverview AI flow to check the resolution of an uploaded image.
 *
 * - checkImageResolution - A function that checks if the image meets the minimum resolution requirements.
 * - CheckImageResolutionInput - The input type for the checkImageResolution function.
 * - CheckImageResolutionOutput - The return type for the checkImageResolution function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CheckImageResolutionInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      'The image data URI to check, must include a MIME type and use Base64 encoding. Expected format: data:<mimetype>;base64,<encoded_data>.'
    ),
  minWidth: z.number().describe('The minimum required width of the image in pixels.'),
  minHeight: z.number().describe('The minimum required height of the image in pixels.'),
});
export type CheckImageResolutionInput = z.infer<typeof CheckImageResolutionInputSchema>;

const CheckImageResolutionOutputSchema = z.object({
  isResolutionMet: z.boolean().describe('Whether the image meets the minimum resolution requirements.'),
  width: z.number().describe('The width of the image in pixels.'),
  height: z.number().describe('The height of the image in pixels.'),
  message: z.string().describe('A message indicating whether the image meets the resolution requirements.'),
});
export type CheckImageResolutionOutput = z.infer<typeof CheckImageResolutionOutputSchema>;

export async function checkImageResolution(input: CheckImageResolutionInput): Promise<CheckImageResolutionOutput> {
  return checkImageResolutionFlow(input);
}

const checkImageResolutionPrompt = ai.definePrompt({
  name: 'checkImageResolutionPrompt',
  input: {schema: CheckImageResolutionInputSchema},
  output: {schema: CheckImageResolutionOutputSchema},
  prompt: `You are an AI assistant that checks if an image meets the minimum resolution requirements for printing.

You are given the image data URI, the minimum required width, and the minimum required height.

Analyze the image and determine its width and height in pixels. Compare the image dimensions to the minimum requirements.

Return a JSON object with the following fields:
- isResolutionMet: true if the image meets the minimum resolution requirements, false otherwise.
- width: The width of the image in pixels.
- height: The height of the image in pixels.
- message: A message indicating whether the image meets the resolution requirements. If the image does not meet the requirements, explain why.

Image data URI: {{media url=imageDataUri}}
Minimum width: {{minWidth}} pixels
Minimum height: {{minHeight}} pixels`,
});

const checkImageResolutionFlow = ai.defineFlow(
  {
    name: 'checkImageResolutionFlow',
    inputSchema: CheckImageResolutionInputSchema,
    outputSchema: CheckImageResolutionOutputSchema,
  },
  async input => {
    const {output} = await checkImageResolutionPrompt(input);
    return output!;
  }
);
