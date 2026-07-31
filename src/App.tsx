import { Outlet } from "react-router";
import { NavBar } from "./components/layout/NavBar";

function App() {
  return (
    <>
      <NavBar />
      <main>
        <Outlet />
      </main>
    </>
  );
}

export default App;
