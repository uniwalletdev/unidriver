# Mobile & iOS design

UniDriver's owner experience runs on two surfaces that share one look and one set of business
rules (`@unidriver/shared`):

1. **Web (`apps/web`)**: mobile-first and installable to the iOS/Android home screen (PWA).
2. **Native iOS and Android apps (`apps/mobile`, next)**: one Expo codebase (Expo Router +
   Clerk Expo) that uses each platform's own patterns.

The visual designs for the native app (five key screens per platform, tokens, navigation) are in
the published iOS and Android design specs. This file is the source of truth for tokens and conventions in the repo.

## Design tokens

These mirror `apps/web/app/globals.css`. The Expo app should read them from one `theme.ts` and
switch on `useColorScheme()`.

| Token   | Light     | Dark      | Use                                 |
| ------- | --------- | --------- | ----------------------------------- |
| brand   | `#4F46E5` | `#818CF8` | Primary actions, selection          |
| earn    | `#059669` | `#34D399` | Money earned, "Live" status         |
| warn    | `#B45309` | `#FBBF24` | Needs owner action (draft, inspect) |
| danger  | `#DC2626` | `#F87171` | Errors                              |
| bg      | `#F5F6FA` | `#0B1120` | Screen background                   |
| surface | `#FFFFFF` | `#111827` | Cards, grouped lists                |
| text    | `#0F172A` | `#E8EDF5` | Primary text                        |
| text-2  | `#475569` | `#A3B0C2` | Secondary text                      |

- **Type:** the system font (SF Pro on iOS). Large Title 34 for screen titles, Body 17, and
  Footnote 13 for metadata. Inputs are **never under 16px**, because iOS Safari zooms the page
  when a smaller input is focused.
- **Shape:** radius 16 on cards, 12 on controls, full on pills. Spacing grid of 4pt.
- **Touch:** every tap target is at least 44pt (48px on web buttons).
- **Status is shown in form, not only colour:** vehicle status is a labelled pill (Live /
  Awaiting inspection / Draft …).

## Web on iPhone (done)

- `viewport-fit=cover` with `env(safe-area-inset-*)` padding, so content clears the notch and the
  home indicator.
- `appleWebApp` metadata, a generated `apple-icon` and `icon`, and `manifest.webmanifest`
  (`display: standalone`), so "Add to Home Screen" opens full-screen.
- Light and dark themes follow the system setting, and `theme-color` matches each theme.
- Forms use the right `inputMode`, `autoComplete` and `autoCapitalize` so iOS shows the correct
  keyboard and autofill.

## Native app plan (`apps/mobile`)

| Tab / screen        | Route              | Backend                                    |
| ------------------- | ------------------ | ------------------------------------------ |
| Welcome + Car Note  | `/welcome`         | none (shared `computeCarNote`)             |
| Garage              | `/(tabs)/garage`   | `GET /api/vehicles/mine`                   |
| Add vehicle (sheet) | `/vehicle/new`     | `POST /api/vehicles`                       |
| Vehicle detail      | `/vehicle/[id]`    | `GET /api/vehicles/:id`, `POST …/activate` |
| Calendar            | `/(tabs)/calendar` | AvailabilityRule API (Phase 1, to build)   |
| Earnings            | `/(tabs)/earnings` | Payouts API (Phase 4)                      |
| Account             | `/(tabs)/account`  | `GET /api/owners/me`                       |

iOS specifics: Sign in with Apple through Clerk (required by App Store rule 4.8 when other social
logins are offered), `expo-camera` VIN barcode scanning with a typed fallback, `expo-image-picker`
for inspection photos, Expo Notifications for booking and payout events, and light haptics on
"Go live".

The `apps/*` workspace glob already picks up `apps/mobile`. Metro needs `watchFolders` pointed at
the repo root so it resolves `@unidriver/shared`.

## Android (Material 3)

The screens, flows and brand are the same as on iOS. Only the patterns below change, switched with
`Platform.OS` inside shared components (React Native Paper supplies the Material 3 parts).

| Element              | iOS                        | Android                                   |
| -------------------- | -------------------------- | ----------------------------------------- |
| Primary "add" action | "+ Add" in the nav bar     | Extended floating action button           |
| Tabs                 | Tab bar                    | Navigation bar with pill active indicator |
| Create flow          | Modal sheet, Cancel / Save | Full-screen dialog, close / Save          |
| Text fields          | Filled, label above        | Outlined, floating label, support text    |
| Tier picker          | Pill buttons               | Filter chips                              |
| Confirmation         | Inline banner + haptic     | Snackbar with Undo                        |
| Back                 | Edge swipe                 | System back gesture (predictive back)     |
| Sign-in              | Sign in with Apple + email | Google via Credential Manager + email     |
| Minimum tap target   | 44pt                       | 48dp                                      |

Material 3 colour roles are generated from the brand indigo. Material You (colours taken from the
wallpaper) stays off so the brand looks the same on every phone.

| Role               | Light     | Dark      |
| ------------------ | --------- | --------- |
| primary            | `#4F46E5` | `#C3C0FF` |
| primaryContainer   | `#E2DFFF` | `#3F38C8` |
| secondaryContainer | `#E3E0F9` | `#46455C` |
| success (custom)   | `#006C4C` | `#9AD6B8` |
| surface            | `#FCF8FF` | `#131318` |
| outline            | `#787585` | `#928F9F` |

Android requirements: apps targeting Android 15 are drawn edge-to-edge, so pad with safe-area
insets. Handle the system back gesture on every screen. Android 13+ asks for notification
permission at runtime, so ask after the first car is listed. Use the Photo Picker (no storage
permission) and `android_ripple` on pressables. Ship an `.aab` through EAS Build, starting on the
Play internal testing track, and fill in the Play Data safety form (name, email, phone, VIN,
photos, approximate location).
