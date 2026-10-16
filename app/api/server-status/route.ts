import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const response = await fetch(
      'https://api.mcsrvstat.us/bedrock/3/hypego.org:19132',
      {
        headers: {
          'User-Agent': 'Hypego-Portal/1.0',
          'Accept': 'application/json',
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) {
      return NextResponse.json({ error: 'Status provider unavailable' }, { status: 502 });
    }

    const data = await response.json();
    const list = Array.isArray(data.players?.list)
      ? data.players.list
          .map((player: unknown) => {
            if (typeof player === 'string') return { name: player };
            if (player && typeof player === 'object' && 'name' in player) {
              const name = (player as { name?: unknown }).name;
              return typeof name === 'string' ? { name } : null;
            }
            return null;
          })
          .filter((player: { name: string } | null): player is { name: string } => player !== null)
      : [];

    return NextResponse.json({
      online: data.online === true,
      playersOnline: Number(data.players?.online || 0),
      playersMax: Number(data.players?.max || 0),
      playerList: list,
    }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch {
    return NextResponse.json({ error: 'Could not check server status' }, { status: 502 });
  }
}
