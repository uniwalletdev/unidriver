/**
 * @unidriver/shared — canonical domain types and pure business logic shared across the
 * NestJS API, the React Native app, and the Next.js web surfaces. Keeping rules here means
 * scoring, gating, money, and payout logic live in exactly one place.
 */
export * from './enums';
export * from './money';
export * from './region';
export * from './trust';
export * from './owner';
export * from './payout';
export * from './booking';
export * from './car-note';
export * from './dto';

export * from './domain/user';
export * from './domain/vehicle';
export * from './domain/booking';
export * from './domain/trust';
export * from './domain/payment';
export * from './domain/insurance';
