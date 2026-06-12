import { ValueTransformer } from 'typeorm';

// PostgreSQL NUMERIC columns come back as strings via node-pg. This transformer
// keeps the entity field typed as a real number on read.
export class NumericTransformer implements ValueTransformer {
  to(value: number | null): number | null {
    return value;
  }

  from(value: string | null): number | null {
    if (value === null || value === undefined) return null;
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
}
