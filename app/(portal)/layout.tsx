import { ToastProvider } from '@/shared/components/Toast';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
