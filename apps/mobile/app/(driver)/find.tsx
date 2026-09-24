import type { DiscoverableVehicle } from '@unidriver/shared';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl } from 'react-native';
import { Banner, Body, Card, Pill, Row, Screen, SectionLabel } from '@/components/ui';
import { api } from '@/lib/api';
import { TRUST_TIER_LABEL, VEHICLE_TIER_LABEL } from '@/lib/labels';
import { useSession } from '@/lib/session';

const FUEL_LABEL: Record<DiscoverableVehicle['fuelPolicy'], string> = {
  FULL_TO_FULL: 'Return full',
  LEVEL_TO_LEVEL: 'Return same fuel level',
  EV_CHARGE_RETURN: 'Return charged',
};

/** Find a car (D3). Cars above the driver's tier are listed, dimmed, with what unlocks them. */
export default function FindACar() {
  const { token, account } = useSession();
  const [cars, setCars] = useState<DiscoverableVehicle[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) {
      return;
    }
    setLoading(true);
    setError('');
    try {
      setCars(await api.discover(token));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Reload whenever the tab gains focus, so newly listed cars show up.
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const open = cars?.filter((c) => !c.locked) ?? [];
  const locked = cars?.filter((c) => c.locked) ?? [];
  const meta = (v: DiscoverableVehicle) =>
    [
      VEHICLE_TIER_LABEL[v.tier],
      FUEL_LABEL[v.fuelPolicy],
      v.mileageCapPerBooking ? `${v.mileageCapPerBooking} mi cap` : null,
    ]
      .filter(Boolean)
      .join(' · ');

  return (
    <Screen
      title="Find a car"
      subtitle={
        account?.approved
          ? 'No rental fee. You only share what you earn.'
          : "Browse now. You can book once you're approved."
      }
      refreshControl={<RefreshControl refreshing={loading && cars !== null} onRefresh={load} />}
    >
      {error ? <Banner message={error} onDismiss={() => setError('')} /> : null}
      {cars === null ? (
        <Card>
          <Body muted>{loading ? 'Loading cars near you…' : 'Pull down to load cars.'}</Body>
        </Card>
      ) : (
        <>
          <Card style={{ gap: 0, paddingVertical: 4 }}>
            {open.length === 0 ? (
              <Row
                first
                title="No cars open to you right now"
                meta="New cars are listed every day. Pull down to refresh."
              />
            ) : (
              open.map((v, i) => (
                <Row
                  key={v.id}
                  first={i === 0}
                  title={`${v.year} ${v.make} ${v.model}`}
                  meta={meta(v)}
                  right={<Pill label="Available" tone="good" />}
                />
              ))
            )}
          </Card>
          {locked.length > 0 ? (
            <>
              <SectionLabel>Unlock with a higher tier</SectionLabel>
              <Card style={{ gap: 0, paddingVertical: 4 }}>
                {locked.map((v, i) => (
                  <Row
                    key={v.id}
                    first={i === 0}
                    dim
                    title={`${v.year} ${v.make} ${v.model}`}
                    meta={meta(v)}
                    right={<Pill label={`🔒 ${TRUST_TIER_LABEL[v.requiredTrustTier]}`} />}
                  />
                ))}
              </Card>
            </>
          ) : null}
          <Body muted style={{ fontSize: 13 }}>
            Choosing a shift time and booking arrive in the next release.
          </Body>
        </>
      )}
    </Screen>
  );
}
