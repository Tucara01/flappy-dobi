"use client";

type HeaderProps = {
  neynarUser?: {
    fid: number;
    score: number;
  } | null;
};

export function Header({ neynarUser }: HeaderProps) {

  return (
    <div className="relative">
      {/* Header panel removed - clean interface */}
    </div>
  );
}
