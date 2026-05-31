import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { BackgroundTheme, WolfEye } from "../../components/BackgroundTheme";
import { ArrowRight, Mail, Lock } from "lucide-react";
import { motion } from "motion/react";
import { signInWithEmailAndPassword, sendPasswordResetEmail, signInWithCredential, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../../firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const [successMsg, setSuccessMsg] = useState(location.state?.message || "");

  useEffect(() => {
    const handleCredentialResponse = async (response: any) => {
      try {
        const credential = GoogleAuthProvider.credential(response.credential);
        await signInWithCredential(auth, credential);
        navigate("/");
      } catch (err: any) {
        console.error("Google One Tap Error:", err);
        setError("حدث خطأ أثناء تسجيل الدخول بواسطة Google.");
      }
    };

    const initGoogleOneTap = () => {
      if ((window as any).google) {
        (window as any).google.accounts.id.initialize({
          client_id: "852323558926-pkt3tosjcsgaund961jgcfr8p8091mia.apps.googleusercontent.com",
          callback: handleCredentialResponse,
        });
        
        const btnContainer = document.getElementById("google-signin-button");
        if (btnContainer) {
          (window as any).google.accounts.id.renderButton(btnContainer, {
            theme: "outline",
            size: "large",
            shape: "pill",
            locale: "ar",
            logo_alignment: "center",
          });
        }
        
        // Show One Tap prompt
        (window as any).google.accounts.id.prompt();
      }
    };

    if ((window as any).google) {
      initGoogleOneTap();
    } else {
      const checkGoogleInterval = setInterval(() => {
        if ((window as any).google) {
          clearInterval(checkGoogleInterval);
          initGoogleOneTap();
        }
      }, 100);
      return () => clearInterval(checkGoogleInterval);
    }
  }, [navigate]);

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

  const handleResetPassword = async () => {
    setError("");
    setSuccessMsg("");
    if (!email) {
      setError("الرجاء إدخال البريد الإلكتروني أولاً لإرسال رابط إعادة التعيين.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMsg("تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.");
    } catch (err: any) {
      console.error("Password Reset Error:", err);
      if (err.code === 'auth/user-not-found') {
        setError("البريد الإلكتروني غير مسجل مسبقاً.");
      } else {
        setError("حدث خطأ أثناء إرسال رابط إعادة التعيين.");
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
                    <button 
                      type="button" 
                      onClick={handleResetPassword}
                      className="text-xs text-gray-400 hover:text-cyan-400 font-bold transition-colors font-medium ml-1"
                    >
                      هل نسيت كلمة المرور؟
                    </button>
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

                <div className="mt-6 flex justify-center">
                  <div id="google-signin-button"></div>
                </div>
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
