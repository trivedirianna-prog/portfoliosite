import { useState } from "react";
import { Boot } from "./boot/Boot";
import { Wallpaper } from "./boot/Wallpaper";
import { TimeOfDayProvider } from "./boot/timeOfDay";
import { Cursor } from "./cursor/Cursor";
import { Desktop } from "./desktop/Desktop";
import { FullscreenToggle } from "./desktop/FullscreenToggle";
import { WindowManagerProvider } from "./windows/WindowManager";
import { WindowHost } from "./windows/WindowHost";

function App() {
  const [booted, setBooted] = useState(false);

  return (
    <WindowManagerProvider>
      <TimeOfDayProvider>
        <Wallpaper />
        <Desktop />
        <WindowHost />
        {!booted && <Boot onComplete={() => setBooted(true)} />}
        <Cursor />
        <FullscreenToggle />
      </TimeOfDayProvider>
    </WindowManagerProvider>
  );
}

export default App;
