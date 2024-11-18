import {type ZodObject, type ZodTypeAny} from 'zod';

type ErrorMessages = { fieldName: string; messages: string[] }[];

export function extractMessages(
  schema: ZodObject<any>, 
  fieldName?: string
):  string[] | ErrorMessages {
  const errorMessages: ErrorMessages = [];

  // Process schema keys and refinements recursively
  const processSchema = (key: string, schemaPart: any) => {
    const fieldErrors: string[] = [];

    // Collect error messages from schema definition checks
    schemaPart._def.checks?.forEach((check: { message?: string }) => {
      if (check.message) {
        fieldErrors.push(check.message);
      }
    });

    // Add the field's errors to the errorMessages array
    if (fieldErrors.length > 0) {
      errorMessages.push({ fieldName: key, messages: fieldErrors });
    }
  };

  // Iterate over schema keys
  for (const key of Object.keys(schema.shape as Record<string, ZodTypeAny>)) {
    processSchema(key, schema.shape[key]);
  }

  // Return errors for a specific field if provided
  if (fieldName) {
    const fieldErrors = errorMessages.find((err) => err.fieldName === fieldName);
    return fieldErrors ? fieldErrors.messages : [];
  }

  // Otherwise, return all errors
  return errorMessages;
}