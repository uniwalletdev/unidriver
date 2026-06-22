/**
 * Telematics adapter — Smartcar / OBD-II in production (spec §3, §10.8). Reads odometer,
 * location and fuel/charge from a connected vehicle and derives a health report.
 */

export interface TelematicsReading {
  odometerMiles: number;
  fuelPercentRemaining: number | null;
  batteryPercentRemaining: number | null;
  latitude: number;
  longitude: number;
  capturedAt: Date;
}

export interface VehicleHealthReport {
  engineWarning: boolean;
  tirePressureWarning: boolean;
  nextServiceMiles: number;
  /** 0–1 driving smoothness score used by the post-trip Car Health Report. */
  smoothnessScore: number;
}

export interface TelematicsAdapter {
  getReading(vehicleExternalId: string): Promise<TelematicsReading>;
  getHealthReport(vehicleExternalId: string): Promise<VehicleHealthReport>;
}
