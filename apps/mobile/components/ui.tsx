import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { radius, TAP, usePalette, type Palette } from '@/lib/theme';

export function Screen({
  children,
  title,
  subtitle,
  refreshControl,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  refreshControl?: React.ComponentProps<typeof ScrollView>['refreshControl'];
}) {
  const c = usePalette();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.screen}
        keyboardShouldPersistTaps="handled"
        refreshControl={refreshControl}
      >
        {title ? (
          <Text accessibilityRole="header" style={[styles.largeTitle, { color: c.text }]}>
            {title}
          </Text>
        ) : null}
        {subtitle ? <Text style={[styles.body, { color: c.text2 }]}>{subtitle}</Text> : null}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const c = usePalette();
  return <View style={[styles.card, { backgroundColor: c.surface }, style]}>{children}</View>;
}

export function SectionLabel({ children }: { children: string }) {
  const c = usePalette();
  return <Text style={[styles.sectionLabel, { color: c.text3 }]}>{children.toUpperCase()}</Text>;
}

export function Body({
  children,
  muted,
  style,
}: {
  children: ReactNode;
  muted?: boolean;
  style?: object;
}) {
  const c = usePalette();
  return <Text style={[styles.body, { color: muted ? c.text2 : c.text }, style]}>{children}</Text>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  busy,
  disabled,
  compact,
}: {
  compact?: boolean;
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  busy?: boolean;
  disabled?: boolean;
}) {
  const c = usePalette();
  const primary = variant === 'primary';
  const off = disabled || busy;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: off, busy }}
      disabled={off}
      onPress={onPress}
      android_ripple={{ color: c.brandSoft }}
      style={({ pressed }) => [
        styles.button,
        compact && { paddingHorizontal: 12 },
        {
          backgroundColor: primary ? c.brand : c.brandSoft,
          opacity: off ? 0.5 : pressed ? 0.85 : 1,
        },
      ]}
    >
      {busy ? (
        <ActivityIndicator color={primary ? c.brandInk : c.brand} />
      ) : (
        <Text style={[styles.buttonText, { color: primary ? c.brandInk : c.brand }]}>{title}</Text>
      )}
    </Pressable>
  );
}

type Tone = 'good' | 'warn' | 'bad' | 'brand' | 'neutral';

function toneColors(c: Palette, tone: Tone): { bg: string; fg: string } {
  switch (tone) {
    case 'good':
      return { bg: c.earnSoft, fg: c.earn };
    case 'warn':
      return { bg: c.warnSoft, fg: c.warn };
    case 'bad':
      return { bg: c.dangerSoft, fg: c.danger };
    case 'brand':
      return { bg: c.brandSoft, fg: c.brand };
    default:
      return { bg: c.fill, fg: c.text2 };
  }
}

export function Pill({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  const t = toneColors(usePalette(), tone);
  return (
    <View style={[styles.pill, { backgroundColor: t.bg }]}>
      <Text style={[styles.pillText, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

export function Row({
  title,
  meta,
  right,
  first,
  dim,
}: {
  title: string;
  meta?: string;
  right?: ReactNode;
  first?: boolean;
  dim?: boolean;
}) {
  const c = usePalette();
  return (
    <View
      style={[
        styles.row,
        {
          borderTopColor: c.border,
          borderTopWidth: first ? 0 : StyleSheet.hairlineWidth,
          opacity: dim ? 0.55 : 1,
        },
      ]}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={[styles.rowTitle, { color: c.text }]}>
          {title}
        </Text>
        {meta ? <Text style={[styles.meta, { color: c.text2 }]}>{meta}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function Field({
  label,
  error,
  ...input
}: TextInputProps & { label: string; error?: string }) {
  const c = usePalette();
  return (
    <View style={{ gap: 6 }}>
      <Text style={[styles.fieldLabel, { color: c.text2 }]}>{label}</Text>
      <TextInput
        placeholderTextColor={c.text3}
        accessibilityLabel={label}
        style={[
          styles.input,
          { backgroundColor: c.fill, color: c.text, borderColor: error ? c.danger : 'transparent' },
        ]}
        {...input}
      />
      {error ? <Text style={[styles.meta, { color: c.danger }]}>{error}</Text> : null}
    </View>
  );
}

export function Meter({ value, met }: { value: number; met?: boolean }) {
  const c = usePalette();
  return (
    <View style={[styles.meter, { backgroundColor: c.fill }]}>
      <View
        style={{
          width: `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%`,
          height: '100%',
          borderRadius: 3,
          backgroundColor: met ? c.earn : c.brand,
        }}
      />
    </View>
  );
}

export function Banner({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  const c = usePalette();
  return (
    <Pressable
      accessibilityRole="alert"
      onPress={onDismiss}
      style={[styles.banner, { backgroundColor: c.dangerSoft }]}
    >
      <Text style={{ color: c.danger, fontSize: 15, flex: 1 }}>{message}</Text>
      {onDismiss ? <Text style={{ color: c.danger, fontWeight: '700' }}>×</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, paddingBottom: 40, gap: 14 },
  largeTitle: { fontSize: 34, fontWeight: '800', letterSpacing: -0.5, marginTop: 8 },
  body: { fontSize: 16, lineHeight: 22 },
  card: { borderRadius: radius.card, padding: 16, gap: 10 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.6,
    marginTop: 8,
    marginLeft: 4,
  },
  button: {
    minHeight: TAP,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  buttonText: { fontSize: 17, fontWeight: '600' },
  pill: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  pillText: { fontSize: 12, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: TAP, paddingVertical: 10 },
  rowTitle: { fontSize: 16, fontWeight: '600' },
  meta: { fontSize: 13, lineHeight: 18 },
  fieldLabel: { fontSize: 14, fontWeight: '600' },
  input: {
    minHeight: TAP,
    borderRadius: radius.control,
    paddingHorizontal: 14,
    fontSize: 17,
    borderWidth: 1,
  },
  meter: { height: 6, borderRadius: 3, overflow: 'hidden' },
  banner: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: radius.control },
});
