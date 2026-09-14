import { useState } from "react";
import { Boot } from "./boot/Boot";
import { Wallpaper } from "./boot/Wallpaper";
import { Desktop } from "./desktop/Desktop";
import { WindowManagerProvider } from "./windows/WindowManager";
import { WindowHost } from "./windows/WindowHost";

function App() {
  const [booted, setBooted] = useState(false);

  return (
    <WindowManagerProvider>
      <Wallpaper />
      <Desktop />
      <WindowHost />
      {!booted && <Boot onComplete={() => setBooted(true)} />}
    </WindowManagerProvider>
  );
}

export default App;
