import { renderIcon } from '../icon';

// The manifest's 192px icon (installability wants one at 192 and one at 512).
// Same drawn stone as /icon, at the smaller box.
export const dynamic = 'force-static';

export function GET() {
  return renderIcon({ width: 192, height: 192 });
}
