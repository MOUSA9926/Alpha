import { useState, useEffect, useRef } from "react";
import { BackgroundTheme } from "../../components/BackgroundTheme";
import { useAuth } from "../../contexts/AuthContext";
import { auth, db } from "../../firebase";
import { updateProfile, updateEmail, updatePassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, User, Shield, Camera, Loader2, Save, Upload, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

type TabType = "personal" | "security";

const GENRES = ["أكشن", "دراما", "رعب", "خيال علمي", "كوميديا", "وثائقي", "رومانسي", "إثارة", "أنمي", "جريمة", "مغامرة"];

export default function Profile() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<TabType>("personal");
  
  // Profile Picture URL
  const [photoUrl, setPhotoUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Personal Info State
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [preferences, setPreferences] = useState<string[]>([]);
  
  // Security State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Loading & Messages
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    setPhotoUrl(userProfile?.photoUrl || currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName || 'User')}&background=0ea5e9&color=fff&bold=true`);
    setName(currentUser.displayName || "");
    setEmail(currentUser.email || "");

    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setGender(data.gender || "");
          setAge(data.age || "");
          
          let prefs: string[] = [];
          if (Array.isArray(data.preferences)) {
            prefs = data.preferences;
          } else if (typeof data.preferences === 'string' && data.preferences) {
            prefs = data.preferences.split(',').map((p: string) => p.trim());
          }
          setPreferences(prefs);
        }
      } catch (error: any) {
        if (error.code !== 'permission-denied') {
          console.error("Error fetching user data:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser, navigate]);

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 5000);
  };

  const handleUpdatePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!currentUser || !file) return;

    if (!file.type.startsWith('image/')) {
      showMessage("الرجاء اختيار ملف صورة صالح", "error");
      return;
    }

    setUploadingPhoto(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 250;
        const MAX_HEIGHT = 250;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Convert to Base64 data URL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);

        try {
          // Save a backup in Firestore too
          await setDoc(doc(db, "users", currentUser.uid), { 
            photoUrl: dataUrl 
          }, { merge: true });
          
          setPhotoUrl(dataUrl);
          showMessage("تم تحديث الصورة بنجاح بدون الحاجة لخدمة التخزين المأجورة", "success");
        } catch (error: any) {
          showMessage(error.message || "حدث خطأ أثناء تحديث الصورة", "error");
        } finally {
          setUploadingPhoto(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      showMessage("حدث خطأ أثناء قراءة الملف", "error");
      setUploadingPhoto(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSaving(true);
    try {
      if (name !== currentUser.displayName) {
        await updateProfile(currentUser, { displayName: name });
      }
      
      await setDoc(doc(db, "users", currentUser.uid), {
        gender,
        age,
        preferences
      }, { merge: true });

      showMessage("تم حفظ المعلومات الشخصية", "success");
    } catch (error: any) {
      showMessage(error.message || "حدث خطأ أثناء الحفظ", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSaving(true);
    try {
      if (email && email !== currentUser.email) {
        await updateEmail(currentUser, email);
      }
      if (password) {
        await updatePassword(currentUser, password);
        setPassword(""); // Clear password field after successful update
      }
      showMessage("تم تحديث معلومات الأمان", "success");
    } catch (error: any) {
      // Re-authentication might be required for email/password updates
      if (error.code === 'auth/requires-recent-login') {
         showMessage("يرجى تسجيل الدخول مجدداً لتغيير هذه الإعدادات", "error");
         setTimeout(() => { auth.signOut(); navigate("/login"); }, 3000);
      } else {
         showMessage(error.message || "حدث خطأ أثناء الحفظ", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <BackgroundTheme>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
        </div>
      </BackgroundTheme>
    );
  }

  return (
    <BackgroundTheme>
      <div className="min-h-screen max-w-[100vw] overflow-x-hidden flex flex-col items-center" dir="rtl">
        {/* Navigation */}
        <nav className="w-full bg-black/50 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-orange-500/10 pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between relative z-10 w-full">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate("/")}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/5"
              >
                <ArrowRight className="w-5 h-5 text-gray-300" />
              </button>
              <span className="font-semibold text-gray-200">الإعدادات</span>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-xl font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-orange-400">
                Alpha
              </span>
            </div>
          </div>
        </nav>

        <div className="w-full max-w-4xl mt-24 px-4 mb-10">
          <div className="w-full bg-black/40 border border-white/10 rounded-3xl backdrop-blur-xl shadow-2xl relative">
          
          {/* Header & Profile Picture */}
          <div className="relative pb-8 px-6 flex flex-col items-center border-b border-white/10 rounded-t-3xl">
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 to-transparent pointer-events-none rounded-t-3xl" />
            
            <div className="relative group -mt-16 mb-4 z-10">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#0a0a0a] shadow-2xl relative bg-[#0a0a0a]">
                <img 
                  src={photoUrl} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
                
                {uploadingPhoto && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                  </div>
                )}

                {!uploadingPhoto && (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                  >
                    <Upload className="w-8 h-8 mb-1" />
                    <span className="text-xs font-bold">تغيير الصورة</span>
                  </div>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleUpdatePhoto} 
                accept="image/*" 
                className="hidden" 
              />
            </div>

            <h1 className="text-2xl font-black text-white relative z-10">{name || "مستخدم جديد"}</h1>
            <p className="text-gray-400 text-sm relative z-10">{currentUser?.email}</p>
          </div>

          <div className="flex flex-col md:flex-row relative rounded-b-3xl overflow-hidden">
            {/* Sidebar Tabs */}
            <div className="md:w-64 border-b md:border-b-0 md:border-l border-white/10 p-3 md:p-4 flex flex-row md:flex-col gap-2 justify-center">
              <button 
                onClick={() => setActiveTab("personal")}
                className={`flex items-center justify-center md:justify-start gap-2 md:gap-3 px-3 py-2 md:px-4 md:py-3 rounded-xl transition-all flex-1 md:flex-none text-sm md:text-base ${activeTab === "personal" ? 'bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
              >
                <User className="w-4 h-4 md:w-5 md:h-5" />
                <span>المعلومات الشخصية</span>
              </button>
              <button 
                onClick={() => setActiveTab("security")}
                className={`flex items-center justify-center md:justify-start gap-2 md:gap-3 px-3 py-2 md:px-4 md:py-3 rounded-xl transition-all flex-1 md:flex-none text-sm md:text-base ${activeTab === "security" ? 'bg-orange-500/10 text-orange-400 font-bold border border-orange-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
              >
                <Shield className="w-4 h-4 md:w-5 md:h-5" />
                <span>كلمة السر والأمان</span>
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 md:p-8 min-h-[400px]">
              
              {message.text && (
                <div className={`p-4 rounded-xl mb-6 text-sm font-medium border ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                  {message.text}
                </div>
              )}

              {activeTab === "personal" && (
                <motion.form 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onSubmit={handleSavePersonal}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm text-gray-400 font-medium">الاسم</label>
                      <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:bg-black/60 transition-colors"
                        placeholder="أدخل اسمك"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-gray-400 font-medium">الجنس</label>
                      <select 
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:bg-black/60 transition-colors appearance-none"
                      >
                        <option value="" disabled className="bg-gray-900">اختر الجنس</option>
                        <option value="male" className="bg-gray-900">ذكر</option>
                        <option value="female" className="bg-gray-900">أنثى</option>
                        <option value="other" className="bg-gray-900">غير ذلك</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-gray-400 font-medium">العمر</label>
                      <input 
                        type="number" 
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:bg-black/60 transition-colors"
                        placeholder="أدخل عمرك"
                        min="1"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-sm text-gray-400 font-medium">التفضيلات (أنواع الأفلام المفضلة)</label>
                    <div className="flex flex-wrap gap-2">
                      {GENRES.map(genre => (
                        <button
                          key={genre}
                          type="button"
                          onClick={() => {
                            setPreferences(prev => 
                              prev.includes(genre) 
                                ? prev.filter(g => g !== genre)
                                : [...prev, genre]
                            )
                          }}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            preferences.includes(genre)
                              ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                              : 'bg-black/40 text-gray-400 border border-white/10 hover:border-cyan-500/50 hover:text-white'
                          }`}
                        >
                          {preferences.includes(genre) && <Check className="w-4 h-4" />}
                          {genre}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex justify-start">
                    <button 
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white px-8 py-3 rounded-xl font-bold transition-all disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      حفظ التغييرات
                    </button>
                  </div>
                </motion.form>
              )}

              {activeTab === "security" && (
                <motion.form 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onSubmit={handleSaveSecurity}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400 font-medium">البريد الإلكتروني</label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full max-w-md bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 focus:bg-black/60 transition-colors text-right"
                      placeholder="Email"
                      dir="ltr"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400 font-medium">تغيير كلمة السر</label>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full max-w-md bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 focus:bg-black/60 transition-colors text-right"
                      placeholder="••••••••"
                      dir="ltr"
                    />
                  </div>

                  <div className="pt-4 border-t border-white/5 flex justify-start">
                    <button 
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white px-8 py-3 rounded-xl font-bold transition-all disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      تحديث الأمان
                    </button>
                  </div>
                </motion.form>
              )}

            </div>
          </div>
        </div>
        </div>
      </div>
    </BackgroundTheme>
  );
}
