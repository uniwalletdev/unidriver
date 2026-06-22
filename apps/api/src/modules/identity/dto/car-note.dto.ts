import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { CarNoteInput, Region } from '@unidriver/shared';

export class CarNoteDto implements CarNoteInput {
  @IsInt()
  @Min(0)
  monthlyPaymentCents: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  avgEarningsPerHourCents?: number;

  @IsOptional()
  @IsEnum(Region)
  region?: Region;
}
