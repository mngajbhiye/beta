import { Route, Routes } from "react-router-dom";

import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <div className="min-h-screen bg-white">
      {/* Shared across all pages */}
      <Navbar
        brandName="Beta"
        navLinks={[
          { name: "Home", href: "/" },
          { name: "Products", href: "/products" },
          { name: "Sale", href: "/sale" },
          { name: "Purchase", href: "/purchase" },
          { name: "Transactions", href: "/transaction" },
        ]}
        signupLabel="SignIn"
        signupHref="/signup"
      />

      {/* Page content changes according to the URL */}
      <Routes>
        <Route path="/" element={<Home />} />

        {/* Catch unmatched URLs */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
