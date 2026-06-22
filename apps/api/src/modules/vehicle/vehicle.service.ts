import { Inject, Injectable } from '@nestjs/common';
import { VehicleTier } from '@unidriver/shared';
import { TELEMATICS_ADAPTER } from '../../adapters/adapters.constants';
import {
  TelematicsAdapter,
  TelematicsReading,
} from '../../adapters/telematics/telematics-adapter.interface';

export interface ActivationCheck {
  ok: boolean;
  reason?: string;
}

/**
 * Vehicle & Listing boundary. Wraps telematics and encodes the agreed-value guard for
 * high-value tiers (spec §7.2 rule 2). Listing/inspection flows arrive in Phase 1/6.
 */
@Injectable()
export class VehicleService {
  constructor(@Inject(TELEMATICS_ADAPTER) private readonly telematics: TelematicsAdapter) {}

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
        reason: 'Luxury/Exotic vehicles require agreedValueCents and valuationSource before activation',
      };
    }
    return { ok: true };
  }

  async latestReading(vehicleExternalId: string): Promise<TelematicsReading> {
    return this.telematics.getReading(vehicleExternalId);
  }
}
