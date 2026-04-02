import ProtectedShell from '@/features/field/components/ProtectedShell';

export default function FieldLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedShell>{children}</ProtectedShell>;
}
