import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { BackgroundTheme, WolfEye } from "../../components/BackgroundTheme";
import { ArrowRight, Mail, Lock } from "lucide-react";
import { motion } from "motion/react";
import { signInWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail } from "firebase/auth";
import { auth, googleProvider } from "../../firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const [successMsg, setSuccessMsg] = useState(location.state?.message || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (err: any) {
      setError("بيانات الدخول غير صحيحة.");
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setSuccessMsg("");
    try {
      await signInWithPopup(auth, googleProvider);
      navigate("/");
    } catch (err: any) {
      console.error("Google Login Error:", err);
      if (err.code === 'auth/unauthorized-domain') {
        setError("نطاق هذا الموقع غير مصرح به في إعدادات Firebase.");
      } else {
        setError("حدث خطأ أثناء تسجيل الدخول بواسطة Google.");
      }
    }
  };

  return (
    <BackgroundTheme>
      <div className="min-h-screen flex flex-col relative z-10" dir="rtl">
        {/* Navigation */}
        <nav className="w-full h-20 sm:h-24 px-6 sm:px-8 flex items-center justify-between shrink-0 max-w-7xl mx-auto">
          <Link 
            to="/" 
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/5 text-white"
          >
            <ArrowRight className="w-5 h-5 text-gray-300" />
          </Link>
          <Link 
            to="/"
            className="text-2xl font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-orange-400 select-none drop-shadow-md"
          >
            Alpha
          </Link>
        </nav>
        
        <div className="flex-1 flex items-center justify-center p-4 mb-10">
          <div className="w-full max-w-md">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
          >
            {/* Subtle glow effect behind card content */}
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-cyan-500/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-orange-500/20 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex justify-center mb-6" dir="ltr">
                <WolfEye theme="ice" position="left" />
                <div aria-hidden="true" className="w-16 mx-4" />
                <WolfEye theme="fire" position="right" />
              </div>

              <h2 className="text-3xl font-black text-center text-white mb-2">مرحباً بعودتك</h2>
              <p className="text-gray-400 text-center mb-8 font-medium">قم بتسجيل الدخول للاستمرار</p>
              
              {successMsg && <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-xl text-green-200 text-xs text-center">{successMsg}</div>}
              {error && <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-xs text-center">{error}</div>}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 mr-1 block" htmlFor="email">البريد الإلكتروني</label>
                  <div className="relative">
                    <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    <input 
                      id="email"
                      type="email" 
                      dir="rtl"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pr-11 pl-4 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-medium text-right"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between mr-1 mb-2">
                    <label className="text-sm font-medium text-gray-300 block" htmlFor="password">كلمة المرور</label>
                    <Link 
                      to="/forgot-password"
                      className="text-xs text-gray-400 hover:text-cyan-400 font-bold transition-colors font-medium ml-1"
                    >
                      هل نسيت كلمة المرور؟
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    <input 
                      id="password"
                      type="password" 
                      dir="rtl"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pr-11 pl-4 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-medium text-right"
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-500 to-orange-500 hover:from-cyan-400 hover:to-orange-400 text-white rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:shadow-[0_0_30px_rgba(249,115,22,0.3)] mt-2"
                >
                  تسجيل الدخول
                </button>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-[#050510]/60 text-gray-400">أو</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="mt-6 w-full flex justify-center items-center py-3.5 px-4 border border-white/10 rounded-xl shadow-sm bg-white/5 text-sm font-bold text-white hover:bg-white/10 transition-all focus:outline-none focus:border-cyan-500/50"
                >
                  <svg className="w-5 h-5 ml-3" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  تسجيل الدخول بواسطة Google
                </button>
              </div>

              <div className="mt-8 text-center border-t border-white/10 pt-6">
                <p className="text-gray-400 text-sm font-medium">
                  ليس لديك حساب؟{' '}
                  <Link to="/signup" className="text-white hover:text-cyan-400 font-bold transition-colors">
                    إنشاء حساب
                  </Link>
                </p>
              </div>
            </div>
          </motion.div>
          </div>
        </div>
      </div>
    </BackgroundTheme>
  );
}
