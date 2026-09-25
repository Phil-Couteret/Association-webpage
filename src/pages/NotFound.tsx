import { useLocation } from "react-router-dom";
import { SEO } from "@/components/SEO";

const NotFound = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <SEO 
        title="404 - Page Not Found | Elektr-Âme"
        description="The page you're looking for doesn't exist. Return to the Elektr-Âme homepage."
        url={`https://www.elektr-ame.com${location.pathname}`}
        keywords="404, page not found, Elektr-Âme"
        robots="noindex, nofollow"
      />
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
        <a href="/" className="text-blue-500 hover:text-blue-700 underline">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
