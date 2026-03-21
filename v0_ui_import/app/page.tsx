import { AppProvider } from '@/lib/app-context';
import { BillboardEyeApp } from '@/components/billboard-eye-app';

export default function Home() {
  return (
    <AppProvider>
      <BillboardEyeApp />
    </AppProvider>
  );
}
