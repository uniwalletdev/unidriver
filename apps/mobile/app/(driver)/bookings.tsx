import { Body, Card, Screen } from '@/components/ui';

/** Bookings (D4/D5) ship with Phase 3: booking orchestration, handoffs and insurance binding. */
export default function Bookings() {
  return (
    <Screen title="Bookings">
      <Card>
        <Body>No bookings yet.</Body>
        <Body muted>
          When booking opens, your upcoming shifts, pickup checks and returns will appear here.
        </Body>
      </Card>
    </Screen>
  );
}
