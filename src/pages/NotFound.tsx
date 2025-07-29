
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import MainHeader from "@/components/MainHeader";
import Footer from "@/components/Footer";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <MainHeader />
      
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">Halaman Tidak Ditemukan</h2>
            <p className="text-gray-600 mb-8">
              Maaf, halaman yang Anda cari tidak dapat ditemukan. 
              Mungkin halaman tersebut telah dipindahkan atau tidak ada.
            </p>
          </div>
          
          <Link to="/">
            <Button className="inline-flex items-center gap-2">
              <Home className="w-4 h-4" />
              Kembali ke Beranda
            </Button>
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default NotFound;
