import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ZodError, ZodType } from 'zod';

@Injectable()
export class ZodValidationPipe<TOutput, TInput = unknown> implements PipeTransform<
  TInput,
  TOutput
> {
  constructor(private readonly schema: ZodType<TOutput, TInput>) {}

  transform(value: TInput): TOutput {
    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          errors: error.issues,
          message: 'Invalid request payload',
        });
      }

      throw error;
    }
  }
}
