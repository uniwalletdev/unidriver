import { Body, Card, Screen } from '@/components/ui';
import { percent } from '@/lib/labels';
import { useSession } from '@/lib/session';

/** Earnings (D6) ship with Phase 4: trip sync from Uber/Lyft and payouts. */
export default function Earnings() {
  const { account } = useSession();
  return (
    <Screen title="Earnings">
      <Card>
        <Body>No trips yet.</Body>
        <Body muted>
          Trips you drive in a UniDriver car will sync here from Uber and Lyft. At your tier you
          keep {account ? percent(account.progress.keepRate) : '88%'} of each trip's gross.
        </Body>
      </Card>
    </Screen>
  );
}
