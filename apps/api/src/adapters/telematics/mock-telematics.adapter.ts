import { Injectable } from '@nestjs/common';
import {
  TelematicsAdapter,
  TelematicsReading,
  VehicleHealthReport,
} from './telematics-adapter.interface';

/** Phase 0 mock — returns a fixed reading near the Houston pilot area. */
@Injectable()
export class MockTelematicsAdapter implements TelematicsAdapter {
  async getReading(_vehicleExternalId: string): Promise<TelematicsReading> {
    return {
      odometerMiles: 42000,
      fuelPercentRemaining: 80,
      batteryPercentRemaining: null,
      latitude: 29.7604,
      longitude: -95.3698,
      capturedAt: new Date(),
    };
  }

  async getHealthReport(_vehicleExternalId: string): Promise<VehicleHealthReport> {
    return {
      engineWarning: false,
      tirePressureWarning: false,
      nextServiceMiles: 3000,
      smoothnessScore: 0.92,
    };
  }
}
