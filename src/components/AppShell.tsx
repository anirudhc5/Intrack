'use client';

import Sidebar from './Sidebar';

export default function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: any;
}) {
  return (
    <div className="min-h-screen bg-[#faf8ff]">
      <Sidebar user={user} />
      <main className="pl-64 min-h-screen flex flex-col">{children}</main>
    </div>
  );
}
