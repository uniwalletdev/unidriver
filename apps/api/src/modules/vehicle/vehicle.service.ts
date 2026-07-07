import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, VehicleStatus } from '@prisma/client';
import { CreateVehicleInput, VehicleTier } from '@unidriver/shared';
import { TELEMATICS_ADAPTER } from '../../adapters/adapters.constants';
import {
  TelematicsAdapter,
  TelematicsReading,
} from '../../adapters/telematics/telematics-adapter.interface';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface ActivationCheck {
  ok: boolean;
  reason?: string;
}

/**
 * Vehicle & Listing boundary. Owns vehicle persistence, the agreed-value guard for high-value
 * tiers (spec §7.2 rule 2), and telematics access. Inspection/Smart Calendar flows extend this
 * in later Phase 1/6 work.
 */
@Injectable()
export class VehicleService {
  constructor(
    @Inject(TELEMATICS_ADAPTER) private readonly telematics: TelematicsAdapter,
    private readonly prisma: PrismaService,
  ) {}

  /** LUXURY/EXOTIC require a documented agreed value before they may go ACTIVE (spec §7.2). */
  requiresAgreedValue(tier: VehicleTier): boolean {
    return tier === VehicleTier.LUXURY || tier === VehicleTier.EXOTIC;
  }

  canActivate(input: {
    tier: VehicleTier;
    agreedValueCents: number | null;
    valuationSource: string | null;
  }): ActivationCheck {
    if (this.requiresAgreedValue(input.tier) && (!input.agreedValueCents || !input.valuationSource)) {
      return {
        ok: false,
        reason:
          'Luxury/Exotic vehicles require agreedValueCents and valuationSource before activation',
      };
    }
    return { ok: true };
  }

  async create(ownerId: string, input: CreateVehicleInput) {
    // Shared and Prisma enums share string values 1:1 (schema mirrors @unidriver/shared).
    const data: Prisma.VehicleUncheckedCreateInput = {
      ownerId,
      make: input.make,
      model: input.model,
      year: input.year,
      vin: input.vin,
      plate: input.plate,
      tier: input.tier as unknown as Prisma.VehicleUncheckedCreateInput['tier'],
      agreedValueCents: input.agreedValueCents ?? null,
      valuationSource: (input.valuationSource ??
        null) as unknown as Prisma.VehicleUncheckedCreateInput['valuationSource'],
      fuelPolicy: (input.fuelPolicy ??
        undefined) as unknown as Prisma.VehicleUncheckedCreateInput['fuelPolicy'],
      mileageCapPerBooking: input.mileageCapPerBooking ?? null,
      allowedTripTypes: (input.allowedTripTypes ??
        undefined) as unknown as Prisma.VehicleUncheckedCreateInput['allowedTripTypes'],
    };
    try {
      return await this.prisma.vehicle.create({ data });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('A vehicle with this VIN is already listed');
      }
      throw error;
    }
  }

  async listForOwner(ownerId: string) {
    return this.prisma.vehicle.findMany({ where: { ownerId }, orderBy: { createdAt: 'desc' } });
  }

  async get(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle ${id} not found`);
    }
    return vehicle;
  }

  /** Owner activates a listing; enforces the agreed-value guard for high-value tiers. */
  async activate(id: string, ownerId: string) {
    const vehicle = await this.get(id);
    if (vehicle.ownerId !== ownerId) {
      throw new ForbiddenException('You can only activate your own vehicle');
    }
    const check = this.canActivate({
      tier: vehicle.tier as unknown as VehicleTier,
      agreedValueCents: vehicle.agreedValueCents,
      valuationSource: vehicle.valuationSource,
    });
    if (!check.ok) {
      throw new BadRequestException(check.reason);
    }
    return this.prisma.vehicle.update({ where: { id }, data: { status: VehicleStatus.ACTIVE } });
  }

  async latestReading(vehicleExternalId: string): Promise<TelematicsReading> {
    return this.telematics.getReading(vehicleExternalId);
  }
}
