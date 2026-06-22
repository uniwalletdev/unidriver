import { Prisma, PrismaClient, Region as PrismaRegion, VehicleTier } from '@prisma/client';
import { Region, REGION_CONFIG } from '@unidriver/shared';

const prisma = new PrismaClient();

const US_INSURANCE_PRODUCTS: Array<{
  tier: VehicleTier;
  weeklyCostCents: number;
  coverageLimitCents: number;
  agreedValueRequired: boolean;
}> = [
  { tier: 'STANDARD', weeklyCostCents: 4500, coverageLimitCents: 100_000_00, agreedValueRequired: false },
  { tier: 'EV_STANDARD', weeklyCostCents: 4800, coverageLimitCents: 100_000_00, agreedValueRequired: false },
  { tier: 'XL_SUV', weeklyCostCents: 5200, coverageLimitCents: 100_000_00, agreedValueRequired: false },
  { tier: 'COMFORT', weeklyCostCents: 6000, coverageLimitCents: 150_000_00, agreedValueRequired: false },
  { tier: 'PREMIUM', weeklyCostCents: 9000, coverageLimitCents: 250_000_00, agreedValueRequired: false },
  { tier: 'LUXURY', weeklyCostCents: 18000, coverageLimitCents: 500_000_00, agreedValueRequired: true },
  { tier: 'EXOTIC', weeklyCostCents: 35000, coverageLimitCents: 1_000_000_00, agreedValueRequired: true },
];

async function main(): Promise<void> {
  // Regulatory rulesets per region — US active; CA/UK defined but inactive (spec §13).
  for (const region of Object.values(Region)) {
    const config = REGION_CONFIG[region];
    await prisma.regulatoryRuleset.upsert({
      where: { region: region as PrismaRegion },
      update: { active: config.active, config: config as unknown as Prisma.InputJsonValue },
      create: {
        region: region as PrismaRegion,
        active: config.active,
        config: config as unknown as Prisma.InputJsonValue,
      },
    });
  }

  // Baseline US insurance products (mock provider) — one per vehicle tier.
  for (const product of US_INSURANCE_PRODUCTS) {
    await prisma.insuranceProduct.upsert({
      where: {
        region_tier_providerName: {
          region: 'US',
          tier: product.tier,
          providerName: 'MockMarkel',
        },
      },
      update: {
        perVehicleWeeklyCostCents: product.weeklyCostCents,
        coverageLimitCents: product.coverageLimitCents,
        agreedValueRequired: product.agreedValueRequired,
      },
      create: {
        region: 'US',
        tier: product.tier,
        providerName: 'MockMarkel',
        perVehicleWeeklyCostCents: product.weeklyCostCents,
        coverageLimitCents: product.coverageLimitCents,
        agreedValueRequired: product.agreedValueRequired,
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log('Seed complete: 3 regulatory rulesets, 7 US insurance products.');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
