import { useState } from 'react';
import { StreamSurface } from './StreamSurface';
import { RecapWidget } from './RecapWidget';
import { createMockStreamSession } from '@shared/mock/mockData';

/** A stream page: the real Kick embed filling the screen, with the recap
 *  widget layered on top of it. `session` is created once per load — a
 *  fresh mock "you just joined" moment each time the page opens. */
export function App() {
  const [session] = useState(createMockStreamSession);

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-page">
      <StreamSurface channel={session.kickChannel} />
      <RecapWidget session={session} />
    </div>
  );
}
