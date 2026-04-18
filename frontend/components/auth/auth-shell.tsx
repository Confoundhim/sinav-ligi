import type { ReactNode } from "react";

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgb(201_168_76_/_0.12),transparent_24%),radial-gradient(circle_at_bottom_left,rgb(199_91_57_/_0.2),transparent_30%)]" />
      <div className="arena-grid absolute inset-0 opacity-40" />

      <div className="relative z-10 grid w-full max-w-6xl gap-6 lg:grid-cols-[1fr_480px]">
        <div className="arena-shell hidden min-h-[680px] flex-col justify-between overflow-hidden p-8 lg:flex xl:p-10">
          <div>
            <p className="text-muted-foreground text-xs tracking-[0.34em] uppercase">
              Sınav Ligi
            </p>
            <h1 className="mt-4 max-w-lg text-5xl font-semibold tracking-[-0.06em] text-balance">
              KPSS hazırlığını rekabetçi bir komuta sistemine taşı.
            </h1>
            <p className="text-muted-foreground mt-6 max-w-xl text-base leading-8">
              Her oda farklı bir strateji, her skor görünür bir baskı, her
              ilerleme ölçülebilir bir avantaj.
            </p>
          </div>

          <div className="grid gap-4">
            {[
              "Haftalık deneme ritmi ve ödül sistemi",
              "Gölge rakip ve duello ile motivasyon baskısı",
              "Öğretmen odasında odaklı içerik erişimi",
            ].map((item) => (
              <div
                key={item}
                className="border-border/60 bg-secondary/45 rounded-2xl border px-5 py-4 text-sm"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="arena-shell border-border/70 relative overflow-hidden p-1">
          <div className="room-card-highlight absolute inset-0 opacity-70" />
          <div className="relative rounded-[calc(var(--radius)*1.4)] border border-white/5 bg-[#211f1e]/95 p-6 shadow-2xl sm:p-8">
            <p className="text-muted-foreground text-xs tracking-[0.34em] uppercase">
              Kimlik Doğrulama
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em]">
              {title}
            </h2>
            <p className="text-muted-foreground mt-3 text-sm leading-7">
              {description}
            </p>
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
