import { z } from "zod";

/**
 * A decorator that abstracts away raw input validation and ensures that when we call our core logic, the input is validated and clean.
 *
 * @param schema - The type validation schema
 * @param logic - The logic to perform on the clean input
 * @returns - Returns the output
 */
export const makeSafe = <Input, Output>(
  schema: z.ZodType<Input>,
  logic: (input: Input) => Promise<Output>,
) => {
  return async (rawInput: unknown): Promise<Output> => {
    const cleanInput = schema.parse(rawInput);

    return logic(cleanInput);
  };
};
