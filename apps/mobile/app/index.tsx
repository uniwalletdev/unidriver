import { Redirect } from 'expo-router';
import { useSession } from '@/lib/session';

/** Entry: signed-in drivers go to their home tab, everyone else to sign-up. */
export default function Index() {
  const { account } = useSession();
  return <Redirect href={account ? '/(driver)' : '/welcome'} />;
}
