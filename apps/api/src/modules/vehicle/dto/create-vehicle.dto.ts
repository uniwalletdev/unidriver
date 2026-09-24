import { IsEnum, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import {
  AllowedTripType,
  CreateVehicleInput,
  FuelPolicy,
  ValuationSource,
  VehicleTier,
} from '@unidriver/shared';

export class CreateVehicleDto implements CreateVehicleInput {
  @IsString()
  @MinLength(1)
  make: string;

  @IsString()
  @MinLength(1)
  model: string;

  @IsInt()
  @Min(1900)
  year: number;

  /** Format + model-year eligibility are checked by the shared rules in VehicleService. */
  @IsString()
  @MinLength(17)
  vin: string;

  @IsString()
  @MinLength(1)
  plate: string;

  @IsEnum(VehicleTier)
  tier: VehicleTier;

  @IsOptional()
  @IsInt()
  @Min(0)
  agreedValueCents?: number | null;

  @IsOptional()
  @IsEnum(ValuationSource)
  valuationSource?: ValuationSource | null;

  @IsOptional()
  @IsEnum(FuelPolicy)
  fuelPolicy?: FuelPolicy;

  @IsOptional()
  @IsInt()
  @Min(0)
  mileageCapPerBooking?: number | null;

  @IsOptional()
  @IsEnum(AllowedTripType)
  allowedTripTypes?: AllowedTripType;
}
