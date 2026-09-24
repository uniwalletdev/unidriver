import { type DriverAccount, type OnboardingStep, type TierRequirement } from '@unidriver/shared';
import { useState } from 'react';
import { RefreshControl, Text, View } from 'react-native';
import {
  Banner,
  Body,
  Button,
  Card,
  Meter,
  Pill,
  Row,
  Screen,
  SectionLabel,
} from '@/components/ui';
import { api } from '@/lib/api';
import { percent, STEP_TITLE, tierList, TRUST_TIER_LABEL } from '@/lib/labels';
import { useSession } from '@/lib/session';
import { usePalette } from '@/lib/theme';

/** Home tab: "Get approved" (D1) until onboarding is done, then "Trust" (D2). */
export default function Home() {
  const { account, token, refresh, signOut } = useSession();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  if (!account || !token) {
    return null;
  }

  async function run(key: string, action: () => Promise<DriverAccount | void>) {
    setBusy(key);
    setError('');
    try {
      const next = await action();
      await refresh(next ?? undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  const refreshControl = (
    <RefreshControl refreshing={busy === 'pull'} onRefresh={() => run('pull', () => refresh())} />
  );

  return account.approved ? (
    <Screen title="Trust" refreshControl={refreshControl}>
      {error ? <Banner message={error} onDismiss={() => setError('')} /> : null}
      <TrustSummary account={account} />
      <NextTier account={account} />
      <SectionLabel>How to raise your score</SectionLabel>
      <Card>
        <Body muted>
          Complete trips, pick up on time, return the car clean with the agreed fuel level, and stay
          inside the mileage cap. Each clean booking adds to your score.
        </Body>
      </Card>
      <Button title="Sign out" variant="secondary" onPress={() => void signOut()} />
    </Screen>
  ) : (
    <Screen
      title="Get approved to drive"
      subtitle="Most drivers are approved in 1–3 days. Pull down to refresh."
      refreshControl={refreshControl}
    >
      {error ? <Banner message={error} onDismiss={() => setError('')} /> : null}
      <Card style={{ gap: 0, paddingVertical: 4 }}>
        {account.onboarding.map((step, i) => (
          <StepRow
            key={step.key}
            step={step}
            first={i === 0}
            account={account}
            busy={busy}
            onCheck={() => run('check', () => api.refreshBackgroundCheck(token))}
            onPayout={() => run('payout', () => api.connectPayoutAccount(token))}
          />
        ))}
      </Card>
      <Card>
        <Body muted>
          You start at{' '}
          <Text style={{ fontWeight: '700' }}>{TRUST_TIER_LABEL[account.progress.tier]}</Text>:{' '}
          {tierList(account.progress.unlockedVehicleTiers)} cars, and you keep{' '}
          <Text style={{ fontWeight: '700' }}>{percent(account.progress.keepRate)}</Text> of every
          trip. Better cars and a bigger share unlock as your Trust Score grows.
        </Body>
      </Card>
      <Button title="Sign out" variant="secondary" onPress={() => void signOut()} />
    </Screen>
  );
}

function StepRow({
  step,
  first,
  account,
  busy,
  onCheck,
  onPayout,
}: {
  step: OnboardingStep;
  first: boolean;
  account: DriverAccount;
  busy: string | null;
  onCheck: () => void;
  onPayout: () => void;
}) {
  const meta = {
    LICENCE: `${account.licenceState} · ending ${account.licenceLast4} · ${step.state === 'DONE' ? 'verified' : 'checked with your background check'}`,
    BACKGROUND_CHECK:
      account.backgroundCheckStatus === 'CONSIDER'
        ? 'A specialist is reviewing your report. No action needed.'
        : 'Driving record, criminal record, SSN trace',
    PAYOUT_ACCOUNT: step.state === 'DONE' ? 'Connected' : 'Where your earnings are paid',
  }[step.key];

  let right: React.ReactNode;
  if (step.state === 'DONE') {
    right = <Pill label="Done" tone="good" />;
  } else if (step.state === 'BLOCKED') {
    right = <Pill label="Contact support" tone="bad" />;
  } else if (step.key === 'BACKGROUND_CHECK') {
    right = (
      <View style={{ width: 120 }}>
        <Button
          compact
          title="Refresh"
          variant="secondary"
          busy={busy === 'check'}
          onPress={onCheck}
        />
      </View>
    );
  } else if (step.key === 'PAYOUT_ACCOUNT') {
    right = (
      <View style={{ width: 120 }}>
        <Button compact title="Connect" busy={busy === 'payout'} onPress={onPayout} />
      </View>
    );
  } else {
    right = <Pill label="In progress" tone="warn" />;
  }
  return <Row first={first} title={STEP_TITLE[step.key]} meta={meta} right={right} />;
}

function TrustSummary({ account }: { account: DriverAccount }) {
  const c = usePalette();
  const { progress } = account;
  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
        <Text
          accessibilityLabel={`Trust score ${account.trustScore} of 1000`}
          style={{ fontSize: 48, fontWeight: '800', color: c.text, fontVariant: ['tabular-nums'] }}
        >
          {account.trustScore}
        </Text>
        <Text style={{ fontSize: 15, color: c.text3, marginBottom: 10 }}>of 1000</Text>
      </View>
      <Meter value={account.trustScore / 1000} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <Pill label={TRUST_TIER_LABEL[progress.tier]} tone="brand" />
        <Text style={{ fontSize: 16, fontWeight: '700', color: c.text }}>
          You keep {percent(progress.keepRate)}
        </Text>
      </View>
      <Body muted>You can book {tierList(progress.unlockedVehicleTiers)} cars.</Body>
    </Card>
  );
}

const REQ_LABEL: Record<TierRequirement['key'], string> = {
  SCORE: 'Trust Score',
  TRIPS: 'Completed trips',
  TENURE_MONTHS: 'Months on UniDriver',
};

/** Mid-sentence wording for "Still needed: …". */
const REQ_NEEDED: Record<TierRequirement['key'], string> = {
  SCORE: 'a higher Trust Score',
  TRIPS: 'more completed trips',
  TENURE_MONTHS: 'more time on UniDriver',
};

function NextTier({ account }: { account: DriverAccount }) {
  const c = usePalette();
  const next = account.progress.next;
  if (!next) {
    return (
      <Card>
        <Body>You're at the top tier. Every car on UniDriver is open to you.</Body>
      </Card>
    );
  }
  const blockers = next.requirements.filter((r) => !r.met).map((r) => REQ_NEEDED[r.key]);
  return (
    <>
      <SectionLabel>{`Next: ${TRUST_TIER_LABEL[next.tier]}`}</SectionLabel>
      <Card>
        <Body muted>
          Keep {percent(next.keepRate)} and unlock {tierList(next.unlocks)} cars.
          {blockers.length > 0 ? ` Still needed: ${blockers.join(' and ')}.` : ''}
        </Body>
        {next.requirements.map((r) => (
          <View key={r.key} style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: c.text2, fontSize: 14 }}>{REQ_LABEL[r.key]}</Text>
              <Text
                style={{
                  color: r.met ? c.earn : c.text,
                  fontSize: 14,
                  fontWeight: '600',
                  fontVariant: ['tabular-nums'],
                }}
              >
                {r.have} / {r.need}
                {r.met ? ' ✓' : ''}
              </Text>
            </View>
            <Meter value={r.need === 0 ? 1 : r.have / r.need} met={r.met} />
          </View>
        ))}
      </Card>
    </>
  );
}
