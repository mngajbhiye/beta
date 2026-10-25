import Navbar from "./components/Navbar";
import "./App.css";

function App() {
  return (
    <div className="min-h-screen bg-white">
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

      <main className="mx-auto max-w-7xl px-5 py-16">
        <h1 className="text-4xl font-bold text-[#0A0A0A]">
          Welcome to Beta
        </h1>

        <p className="mt-4 text-[#525252]">Discover our products.</p>
      </main>
    </div>
  );
}

export default App;
