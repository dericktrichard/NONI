import { nameSize } from "@/lib/share/layout";

export const CARD_SIZE = { width: 1200, height: 630 } as const;

const C = {
  bg: "#000000",
  fg: "#fafaf7",
  muted: "#8f8f8a",
  line: "#2b2b2b",
  accent: "#c8ff00",
};

function Shell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        width: CARD_SIZE.width,
        height: CARD_SIZE.height,
        display: "flex",
        flexDirection: "column",
        background: C.bg,
        color: C.fg,
        padding: 48,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          height: 40,
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ width: 16, height: 16, background: C.accent, marginRight: 14 }} />
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: 6 }}>NONI</div>
        </div>
        <div
          style={{
            fontSize: 20,
            letterSpacing: 4,
            color: C.muted,
            textTransform: "uppercase",
          }}
        >
          {label}
        </div>
      </div>
      <div style={{ display: "flex", flex: 1, marginTop: 24 }}>{children}</div>
    </div>
  );
}

function Art({
  src,
  width,
  height,
}: {
  src: string | null;
  width: number;
  height: number;
}) {
  if (!src) {
    return (
      <div
        style={{
          width,
          height,
          display: "flex",
          background: "#141414",
          border: `1px solid ${C.line}`,
        }}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} width={width} height={height} alt="" style={{ objectFit: "cover" }} />
  );
}

export function BrandCard() {
  return (
    <Shell label="Powerscaling">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          flex: 1,
        }}
      >
        <div style={{ fontSize: 150, fontWeight: 700, letterSpacing: 10 }}>NONI</div>
        <div style={{ fontSize: 38, color: C.muted, marginTop: 8 }}>
          Cross-media powerscaling, backed by evidence.
        </div>
      </div>
    </Shell>
  );
}

interface CharacterCardProps {
  name: string;
  verse: string;
  tier: string;
  score: number;
  rank: number | null;
  verified: number;
  total: number;
  portrait: string | null;
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        border: `1px solid ${C.line}`,
        padding: "14px 22px",
        marginRight: 16,
      }}
    >
      <div
        style={{
          fontSize: 18,
          letterSpacing: 3,
          color: C.muted,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          fontSize: 44,
          fontWeight: 700,
          marginTop: 6,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function CharacterCard({
  name,
  verse,
  tier,
  score,
  rank,
  verified,
  total,
  portrait,
}: CharacterCardProps) {
  const filled = total > 0 ? Math.round((12 * verified) / total) : 0;

  return (
    <Shell label="Character">
      <Art src={portrait} width={313} height={470} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          flex: 1,
          marginLeft: 48,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 24,
              letterSpacing: 4,
              color: C.muted,
              textTransform: "uppercase",
            }}
          >
            {verse}
          </div>
          <div
            style={{
              fontSize: nameSize(name, 84),
              fontWeight: 700,
              lineHeight: 1.02,
              marginTop: 14,
            }}
          >
            {name}
          </div>
        </div>

        <div style={{ display: "flex" }}>
          <Stat label="Rank">
            {rank === 1 ? (
              <div
                style={{ width: 16, height: 16, background: C.accent, marginRight: 12 }}
              />
            ) : null}
            {rank ? `#${rank}` : "--"}
          </Stat>
          <Stat label="Score">{score.toLocaleString("en-US")}</Stat>
          <Stat label="Tier">{tier || "--"}</Stat>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex" }}>
            {Array.from({ length: 12 }, (_, i) => (
              <div
                key={i}
                style={{
                  width: 28,
                  height: 10,
                  marginRight: 6,
                  background: i < filled ? C.fg : "transparent",
                  border: `1px solid ${i < filled ? C.fg : C.line}`,
                }}
              />
            ))}
          </div>
          <div style={{ fontSize: 24, color: C.muted, marginTop: 12 }}>
            {`${verified} of ${total} feats verified`}
          </div>
        </div>
      </div>
    </Shell>
  );
}

interface SideProps {
  name: string;
  verse: string;
  portrait: string | null;
  winner: boolean;
}

function Side({ name, verse, portrait, winner }: SideProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", width: 300 }}>
      <Art src={portrait} width={300} height={370} />
      <div style={{ display: "flex", alignItems: "center", marginTop: 14 }}>
        {winner ? (
          <div style={{ width: 14, height: 14, background: C.accent, marginRight: 10 }} />
        ) : null}
        <div style={{ fontSize: nameSize(name, 34), fontWeight: 700 }}>{name}</div>
      </div>
      <div
        style={{
          fontSize: 18,
          letterSpacing: 3,
          color: C.muted,
          textTransform: "uppercase",
          marginTop: 4,
        }}
      >
        {verse}
      </div>
    </div>
  );
}

interface MatchupCardProps {
  a: Omit<SideProps, "winner">;
  b: Omit<SideProps, "winner">;
  winner: "a" | "b" | null;
  verdict: string;
}

export function MatchupCard({ a, b, winner, verdict }: MatchupCardProps) {
  return (
    <Shell label="Matchup">
      <div style={{ display: "flex", flex: 1, justifyContent: "space-between" }}>
        <Side {...a} winner={winner === "a"} />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: 440,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 96,
              height: 96,
              background: C.fg,
              color: C.bg,
              fontSize: 40,
              fontWeight: 700,
            }}
          >
            VS
          </div>
          <div
            style={{
              fontSize: 44,
              fontWeight: 700,
              textAlign: "center",
              marginTop: 28,
              lineHeight: 1.1,
            }}
          >
            {verdict}
          </div>
          <div style={{ fontSize: 20, color: C.muted, marginTop: 16 }}>
            Decided by verified feats
          </div>
        </div>
        <Side {...b} winner={winner === "b"} />
      </div>
    </Shell>
  );
}
