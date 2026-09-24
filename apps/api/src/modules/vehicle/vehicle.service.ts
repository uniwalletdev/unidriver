import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, VehicleStatus } from '@prisma/client';
import {
  canActivateVehicle,
  checkVehicleYear,
  CreateVehicleInput,
  isValidVin,
  normalizeVin,
  Region,
  UserRole,
  ValuationSource,
  VehicleStatus as SharedVehicleStatus,
  VehicleTier,
} from '@unidriver/shared';
import { TELEMATICS_ADAPTER } from '../../adapters/adapters.constants';
import {
  TelematicsAdapter,
  TelematicsReading,
} from '../../adapters/telematics/telematics-adapter.interface';
import { PrismaService } from '../../common/prisma/prisma.service';

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

  async create(ownerId: string, input: CreateVehicleInput) {
    const owner = await this.prisma.user.findUnique({
      where: { id: ownerId },
      select: { region: true },
    });
    if (!owner) {
      throw new NotFoundException('Register as an owner before listing a vehicle');
    }
    const region = owner.region as unknown as Region;
    if (!isValidVin(input.vin)) {
      throw new BadRequestException('VIN must be 17 characters (letters I, O and Q are not used)');
    }
    const year = checkVehicleYear(input.year, region);
    if (!year.ok) {
      throw new BadRequestException(year.reason);
    }

    // Shared and Prisma enums share string values 1:1 (schema mirrors @unidriver/shared).
    const data: Prisma.VehicleUncheckedCreateInput = {
      ownerId,
      make: input.make,
      model: input.model,
      year: input.year,
      vin: normalizeVin(input.vin),
      plate: input.plate.trim().toUpperCase(),
      region: owner.region,
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

  /**
   * Full vehicle record (VIN, plate) for its owner or an admin only. Anyone else gets a 404 so
   * ids cannot be probed; driver-facing discovery ships a redacted projection in Phase 2.
   */
  async get(id: string, viewer: { userId: string; role: UserRole }) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle || (viewer.role !== UserRole.ADMIN && vehicle.ownerId !== viewer.userId)) {
      throw new NotFoundException(`Vehicle ${id} not found`);
    }
    return vehicle;
  }

  /** Owner activates a listing; enforces the agreed-value guard for high-value tiers. */
  async activate(id: string, ownerId: string) {
    const vehicle = await this.get(id, { userId: ownerId, role: UserRole.OWNER });
    const check = canActivateVehicle({
      tier: vehicle.tier as unknown as VehicleTier,
      status: vehicle.status as unknown as SharedVehicleStatus,
      agreedValueCents: vehicle.agreedValueCents,
      valuationSource: vehicle.valuationSource as unknown as ValuationSource | null,
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
