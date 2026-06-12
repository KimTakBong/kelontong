import { BadRequestException, ValidationError } from '@nestjs/common';

// Turns class-validator errors into our { message, details[] } shape so the
// exception filter can emit field-level details per the API contract.
export function validationExceptionFactory(
  errors: ValidationError[],
): BadRequestException {
  const details = flatten(errors);
  return new BadRequestException({
    message: 'Validation failed',
    details,
  });
}

function flatten(
  errors: ValidationError[],
  parentPath = '',
): { field: string; message: string }[] {
  const result: { field: string; message: string }[] = [];

  for (const err of errors) {
    const field = parentPath ? `${parentPath}.${err.property}` : err.property;

    if (err.constraints) {
      // Take the first constraint message per field — concise for the UI.
      const message = Object.values(err.constraints)[0];
      result.push({ field, message });
    }

    if (err.children?.length) {
      result.push(...flatten(err.children, field));
    }
  }

  return result;
}
