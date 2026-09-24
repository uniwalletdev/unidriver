import { Redirect } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { Banner, Body, Button, Card, Field, Screen } from '@/components/ui';
import { useSession } from '@/lib/session';

/** Driver sign-up. Submitting also starts the background check (API side). */
export default function Welcome() {
  const { account, register } = useSession();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    licenceNumber: '',
    licenceState: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [tried, setTried] = useState(false);

  if (account) {
    return <Redirect href="/(driver)" />;
  }

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const errors = {
    fullName: form.fullName.trim() ? undefined : 'Enter your name as it appears on your licence',
    email: /^\S+@\S+\.\S+$/.test(form.email) ? undefined : 'Enter a valid email',
    phone: form.phone.replace(/\D/g, '').length >= 7 ? undefined : 'Enter your mobile number',
    licenceNumber: /^[A-Za-z0-9 -]{4,20}$/.test(form.licenceNumber)
      ? undefined
      : 'Enter the number on your licence',
    licenceState: /^[A-Za-z]{2}$/.test(form.licenceState) ? undefined : 'Two letters, e.g. TX',
  };
  const valid = Object.values(errors).every((e) => !e);
  const show = (key: keyof typeof errors) => (tried ? errors[key] : undefined);

  async function onSubmit() {
    setTried(true);
    setError('');
    if (!valid) {
      return;
    }
    setBusy(true);
    try {
      await register({ ...form, fullName: form.fullName.trim(), email: form.email.trim() });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen
        title="Drive a better car. Keep more of every trip."
        subtitle="Book vetted owners' cars for your Uber and Lyft shifts. No rental fee: UniDriver only takes a share of what you earn."
      >
        {error ? <Banner message={error} onDismiss={() => setError('')} /> : null}
        <Card>
          <Field
            label="Full name"
            autoComplete="name"
            textContentType="name"
            value={form.fullName}
            onChangeText={set('fullName')}
            error={show('fullName')}
          />
          <Field
            label="Email"
            autoComplete="email"
            textContentType="emailAddress"
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.email}
            onChangeText={set('email')}
            error={show('email')}
          />
          <Field
            label="Mobile number"
            autoComplete="tel"
            textContentType="telephoneNumber"
            keyboardType="phone-pad"
            placeholder="+1 713 555 0100"
            value={form.phone}
            onChangeText={set('phone')}
            error={show('phone')}
          />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 2 }}>
              <Field
                label="Licence number"
                autoCapitalize="characters"
                autoCorrect={false}
                value={form.licenceNumber}
                onChangeText={set('licenceNumber')}
                error={show('licenceNumber')}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label="State"
                autoCapitalize="characters"
                maxLength={2}
                placeholder="TX"
                value={form.licenceState}
                onChangeText={(v) => set('licenceState')(v.toUpperCase())}
                error={show('licenceState')}
              />
            </View>
          </View>
        </Card>
        <Body muted style={{ fontSize: 13 }}>
          Next, we run a background check (driving record, criminal record and SSN trace). Most
          drivers are approved in 1–3 days.
        </Body>
        <Button title="Create driver account" onPress={onSubmit} busy={busy} />
      </Screen>
    </KeyboardAvoidingView>
  );
}
