export default function GroupDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="flex min-h-screen bg-gray-50">
        <main className="flex-1 md:ml-64 mb-16 md:mb-0">
          {children}
        </main>
      </div>
    </>
  );
}

