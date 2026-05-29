import type { ReactNode } from 'react';

export default function LandscapeGuard({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

