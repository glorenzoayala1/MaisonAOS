import { MirrorScreen } from "./MirrorScreen";
import { AdminScreen } from "./AdminScreen";

function App() {
  const path = window.location.pathname;

  const isAdmin = path === "/admin" || path === "/admin/";

  if (isAdmin) {
    return <AdminScreen />;
  }

  return <MirrorScreen />;
}

export default App;

