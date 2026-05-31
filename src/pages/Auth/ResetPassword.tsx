import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { BackgroundTheme, WolfEye } from "../../components/BackgroundTheme";
import { Lock } from "lucide-react";
import { motion } from "motion/react";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "../../firebase";

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(true);
  const [isCodeValid, setIsCodeValid] = useState(false);
  const [email, setEmail] = useState("");
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const oobCode = searchParams.get("oobCode");

  useEffect(() => {
    // التحقق من صحة الكود القادم من الرابط
    if (oobCode) {
      verifyPasswordResetCode(auth, oobCode)
        .then((userEmail) => {
          setEmail(userEmail);
          setIsCodeValid(true);
          setIsVerifyingCode(false);
        })
        .catch((err) => {
          console.error("Invalid code", err);
          setError("رابط الاستعادة غير صالح أو منتهي الصلاحية.");
          setIsVerifyingCode(false);
        });
    } else {
      setError("لا يوجد رمز استعادة في الرابط.");
      setIsVerifyingCode(false);
    }
  }, [oobCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    
    if (newPassword.length < 8) {
      setError("يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.");
      return;
    }

    if (!oobCode) return;

    setIsLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setSuccessMsg("تم تغيير كلمة المرور بنجاح. يتم تحويلك...");
      setTimeout(() => {
        navigate("/login", { state: { message: "تم تغيير كلمة المرور بنجاح، يمكنك تسجيل الدخول الآن." } });
      }, 3000);
    } catch (err: any) {
      console.error("Password Confirm Error:", err);
      setError("حدث خطأ أثناء تغيير كلمة المرور.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BackgroundTheme>
      <div className="min-h-screen flex flex-col relative z-10" dir="rtl">
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

                <h2 className="text-3xl font-black text-center text-white mb-2">إعادة تعيين كلمة المرور</h2>
                
                {isVerifyingCode ? (
                  <p className="text-gray-400 text-center mb-8 font-medium">جاري التحقق من الرابط...</p>
                ) : !isCodeValid ? (
                  <div className="text-center">
                    <p className="text-red-400 mb-8 font-medium">{error}</p>
                    <Link 
                      to="/forgot-password"
                      className="w-full inline-block text-center bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all"
                    >
                      طلب رابط جديد
                    </Link>
                  </div>
                ) : (
                  <>
                    <p className="text-gray-400 text-center mb-8 font-medium text-sm">
                      إعادة تعيين كلمة المرور للحساب:<br/>
                      <span className="text-cyan-400 font-bold" dir="ltr">{email}</span>
                    </p>
                    
                    {successMsg && <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-xl text-green-200 text-sm text-center">{successMsg}</div>}
                    {error && <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm text-center">{error}</div>}

                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 mr-1 block" htmlFor="newPassword">كلمة المرور الجديدة</label>
                        <div className="relative">
                          <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                          <input 
                            id="newPassword"
                            type="password" 
                            dir="rtl"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pr-11 pl-4 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-medium text-right"
                            required
                            minLength={8}
                          />
                        </div>
                      </div>

                      <button 
                        type="submit"
                        disabled={isLoading || !!successMsg}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-cyan-500/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                      >
                        {isLoading ? "جاري الحفظ..." : "حفظ كلمة المرور"}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </BackgroundTheme>
  );
}
