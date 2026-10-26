import { Link } from "react-router-dom";

function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-5 text-center">
      <h1 className="text-6xl font-bold text-[#0A0A0A]">404</h1>

      <p className="mt-4 text-[#525252]">
        Sorry, the page you're looking for doesn't exist.
      </p>

      <Link
        to="/"
        className="mt-6 rounded-lg bg-[#171717] px-5 py-3 text-white hover:bg-[#404040]"
      >
        Back to Home
      </Link>
    </main>
  );
}

export default NotFound;
