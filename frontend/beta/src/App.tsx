import { Route, Routes } from "react-router-dom";

import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Customers from "./pages/Customers";
import Products from "./pages/Products";
import Transactions from "./pages/Transactions";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <div className="min-h-screen bg-white">
      {/* Shared across all pages */}
      <Navbar
        brandName="Beta"
        navLinks={[
          { name: "Home", href: "/" },
          { name: "Customers", href: "/customers" },
          { name: "Products", href: "/products" },
          { name: "Transactions", href: "/transactions" },
          { name: "Dashboard", href: "/dashboard" },
        ]}
        signupLabel="SignIn"
        signupHref="/signup"
      />

      {/* Page content changes according to the URL */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/products" element={<Products />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Catch unmatched URLs */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
