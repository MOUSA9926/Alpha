import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BackgroundTheme, WolfEye } from "../../components/BackgroundTheme";
import { ArrowRight, Mail } from "lucide-react";
import { motion } from "motion/react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../firebase";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setIsLoading(true);

    try {
      // إرسال رابط التعيين.
      const actionCodeSettings = {
        url: `${window.location.origin}/reset-password`,
        handleCodeInApp: true
      };
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      setSuccessMsg("تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني بنجاح. يرجى التحقق من صندوق الوارد.");
    } catch (err: any) {
      console.error("Password Reset Error:", err);
      if (err.code === 'auth/user-not-found') {
        setError("البريد الإلكتروني غير مسجل مسبقاً.");
      } else {
        setError("حدث خطأ أثناء الإرسال. تأكد من صحة البريد الإلكتروني.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BackgroundTheme>
      <div className="min-h-screen flex flex-col relative z-10" dir="rtl">
        <header className="p-4 sm:p-8">
          <Link 
            to="/login" 
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/5 text-white"
          >
            <ArrowRight className="w-5 h-5 text-gray-300" />
          </Link>
        </header>

        <div className="flex-1 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 to-transparent blur-xl rounded-full" />
              
              <div className="relative bg-[#050510]/80 backdrop-blur-xl border border-white/10 p-8 sm:p-10 rounded-3xl shadow-2xl">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-cyan-500/20 to-transparent rounded-2xl flex items-center justify-center border border-cyan-500/30 shadow-lg shadow-cyan-500/20">
                    <WolfEye className="text-cyan-400 w-10 h-10 sm:w-12 sm:h-12" />
                  </div>
                </div>

                <h2 className="text-3xl font-black text-center text-white mb-2">استعادة كلمة المرور</h2>
                <p className="text-gray-400 text-center mb-8 font-medium">أدخل بريدك الإلكتروني لإرسال رابط التعيين</p>
                
                {successMsg && <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-xl text-green-200 text-sm text-center">{successMsg}</div>}
                {error && <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm text-center">{error}</div>}

                {!successMsg ? (
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

                    <button 
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-cyan-500/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                    >
                      {isLoading ? "جاري الإرسال..." : "إرسال رابط الاستعادة"}
                    </button>
                  </form>
                ) : (
                  <Link 
                    to="/login"
                    className="w-full flex text-center justify-center bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all mt-2"
                  >
                    العودة لتسجيل الدخول
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </BackgroundTheme>
  );
}
