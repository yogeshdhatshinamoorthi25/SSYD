
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Heart, ChevronRight, ChevronLeft, CheckCircle2, Lock, Unlock, Camera, Plus, Trash2, Image as ImageIcon, MapPin, Calendar, CheckSquare, Square } from 'lucide-react';
import confetti from 'canvas-confetti';
import { LOVE_MESSAGES, TIMELINE_DATA } from './constants';
import FloatingHearts from './components/FloatingHearts';

// --- Types ---
enum Screen {
  GATE = 1,
  WELCOME = 2,
  TIMELINE = 3,
  GALLERY = 4,
  REVEAL = 5,
  PROPOSAL = 6,
  DATES = 7
}

interface DateSuggestion {
  id: string;
  name: string;
  location: string;
  dateAdded: string;
  visited: boolean;
}

// --- Helper: Image Compression ---
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(dataUrl);
      };
    };
    reader.onerror = reject;
  });
};

// --- Animation Components ---
const FadeIn: React.FC<{ children: React.ReactNode; className?: string; delay?: number }> = ({ children, className, delay = 0 }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className={`transition-all duration-1000 transform ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} ${className}`}>
      {children}
    </div>
  );
};

// --- Main App ---
const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.GATE);
  const [gateStep, setGateStep] = useState(1);
  const [yearInput, setYearInput] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [gateError, setGateError] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [randomMessage, setRandomMessage] = useState<string | null>(null);
  const [randomImageIndex, setRandomImageIndex] = useState<number | null>(null);
  const [proposalStatus, setProposalStatus] = useState<'pending' | 'yes' | 'always'>('pending');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [dateSuggestions, setDateSuggestions] = useState<DateSuggestion[]>([]);
  
  // Form states for adding dates
  const [newPlaceName, setNewPlaceName] = useState('');
  const [newPlaceLocation, setNewPlaceLocation] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load from local storage on mount
  useEffect(() => {
    const savedImages = localStorage.getItem('ys_gallery_images');
    if (savedImages) {
      try { setGalleryImages(JSON.parse(savedImages)); } catch (e) { console.error(e); }
    }
    const savedDates = localStorage.getItem('ys_date_suggestions');
    if (savedDates) {
      try { setDateSuggestions(JSON.parse(savedDates)); } catch (e) { console.error(e); }
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('ys_gallery_images', JSON.stringify(galleryImages));
  }, [galleryImages]);

  useEffect(() => {
    localStorage.setItem('ys_date_suggestions', JSON.stringify(dateSuggestions));
  }, [dateSuggestions]);

  const handleGateSubmit = () => {
    setGateError('');
    const normalizedYear = yearInput.trim();
    const normalizedCity = cityInput.trim().toLowerCase();

    if (gateStep === 1) {
      if (normalizedYear === '2022') {
        setGateStep(2);
      } else {
        setGateError('Hmm… try again. Think about when everything changed 🌸');
      }
    } else if (gateStep === 2) {
      if (normalizedCity === 'grenoble') {
        setIsAdmin(false);
        setIsUnlocked(true);
        setTimeout(() => setCurrentScreen(Screen.WELCOME), 3500);
      } else if (normalizedCity === 'madurai') {
        setIsAdmin(true);
        setIsUnlocked(true);
        setTimeout(() => setCurrentScreen(Screen.WELCOME), 3500);
      } else {
        setGateError('Not quite… think about the city where destiny worked overtime 🚲');
      }
    }
  };

  const handleBack = () => {
    setGateError('');
    if (currentScreen === Screen.GATE) {
      if (gateStep === 2) setGateStep(1);
    } else if (currentScreen === Screen.WELCOME) {
      setIsUnlocked(false);
      setGateStep(2);
      setCurrentScreen(Screen.GATE);
    } else if (currentScreen === Screen.TIMELINE) {
      setCurrentScreen(Screen.WELCOME);
    } else if (currentScreen === Screen.GALLERY) {
      setCurrentScreen(Screen.TIMELINE);
    } else if (currentScreen === Screen.REVEAL) {
      setCurrentScreen(Screen.GALLERY);
    } else if (currentScreen === Screen.PROPOSAL) {
      if (proposalStatus !== 'pending') {
        setProposalStatus('pending');
      } else {
        setCurrentScreen(Screen.REVEAL);
      }
    } else if (currentScreen === Screen.DATES) {
      setCurrentScreen(Screen.PROPOSAL);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newImages: string[] = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const compressed = await compressImage(files[i]);
        newImages.push(compressed);
      } catch (err) {
        console.error(err);
      }
    }
    setGalleryImages(prev => [...prev, ...newImages]);
  };

  const deleteImage = (index: number) => {
    setGalleryImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleShowRandomMessage = useCallback(() => {
    const randomMsgIndex = Math.floor(Math.random() * LOVE_MESSAGES.length);
    setRandomMessage(LOVE_MESSAGES[randomMsgIndex]);
    if (galleryImages.length > 0) {
      const randomImgIdx = Math.floor(Math.random() * galleryImages.length);
      setRandomImageIndex(randomImgIdx);
    }
  }, [galleryImages]);

  const triggerConfetti = (isAlways: boolean) => {
    const duration = isAlways ? 5 * 1000 : 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  const handleProposal = (choice: 'yes' | 'always') => {
    setProposalStatus(choice);
    triggerConfetti(choice === 'always');
  };

  const handleAddDate = () => {
    if (!newPlaceName.trim()) return;
    const newDate: DateSuggestion = {
      id: Date.now().toString(),
      name: newPlaceName,
      location: newPlaceLocation || 'Location TBD',
      dateAdded: new Date().toLocaleDateString(),
      visited: false
    };
    setDateSuggestions(prev => [newDate, ...prev]);
    setNewPlaceName('');
    setNewPlaceLocation('');
  };

  const toggleVisited = (id: string) => {
    setDateSuggestions(prev => prev.map(d => d.id === id ? { ...d, visited: !d.visited } : d));
  };

  const deleteDate = (id: string) => {
    setDateSuggestions(prev => prev.filter(d => d.id !== id));
  };

  return (
    <div className="relative min-h-screen w-full font-sans bg-[#FFF5F7] select-none touch-manipulation">
      <FloatingHearts />
      
      {/* Global Back Button */}
      {((currentScreen === Screen.GATE && gateStep > 1 && !isUnlocked) || (currentScreen > Screen.GATE)) && (
        <button 
          onClick={handleBack}
          className="fixed top-6 left-6 z-50 flex items-center gap-1 text-pink-300 hover:text-pink-500 transition-colors font-sans font-medium text-sm group p-2"
        >
          <ChevronLeft className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" />
          Back
        </button>
      )}

      <div className="relative z-10 w-full min-h-screen flex flex-col overflow-x-hidden">
        
        {/* SCREEN 1: GATE */}
        {currentScreen === Screen.GATE && (
          <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
            {!isUnlocked ? (
              <FadeIn className="w-full max-w-md">
                <div className="mb-8 flex justify-center">
                  <div className="p-4 bg-white rounded-full shadow-soft-pink">
                    <Lock className="w-8 h-8 text-pink-300" />
                  </div>
                </div>
                <h1 className="text-3xl font-serif mb-2 text-gray-800 italic">Only one person can enter this story…</h1>
                <p className="text-pink-400 mb-10 text-sm tracking-wide uppercase font-sans font-medium">This space belongs to us 💞</p>
                
                <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-pink-100">
                  <div className="space-y-6">
                    {gateStep === 1 ? (
                      <>
                        <label className="block text-gray-600 font-sans text-lg">Since what year have we been writing our story?</label>
                        <input 
                          type="number" 
                          inputMode="numeric"
                          autoFocus
                          value={yearInput}
                          onChange={(e) => setYearInput(e.target.value)}
                          placeholder="YYYY"
                          className="w-full p-4 rounded-xl border-pink-200 border-2 focus:outline-none focus:border-pink-400 text-center text-xl text-gray-700 font-sans transition-all"
                        />
                      </>
                    ) : (
                      <div className="animate-[fadeIn_0.5s_ease-out]">
                        <label className="block text-gray-600 font-sans text-lg">Where did our story begin?</label>
                        <input 
                          type="text" 
                          autoFocus
                          value={cityInput}
                          onChange={(e) => setCityInput(e.target.value)}
                          placeholder="Enter city..."
                          className="w-full p-4 mt-6 rounded-xl border-pink-200 border-2 focus:outline-none focus:border-pink-400 text-center text-xl text-gray-700 font-sans transition-all"
                        />
                      </div>
                    )}
                  </div>

                  {gateError && <p className="mt-4 text-red-400 text-sm italic animate-pulse">{gateError}</p>}
                  
                  <button 
                    onClick={handleGateSubmit}
                    className="mt-8 w-full bg-pink-400 hover:bg-pink-500 text-white font-sans font-bold py-4 rounded-xl transition-all shadow-lg active:scale-95 transform"
                  >
                    Continue
                  </button>
                </div>
              </FadeIn>
            ) : (
              <div className="fixed inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-50">
                <FadeIn className="text-center p-10 bg-white rounded-[3rem] shadow-2xl border border-pink-200 mx-6">
                   <div className="mb-6 flex justify-center">
                    <Unlock className="w-16 h-16 text-green-400 animate-bounce" />
                  </div>
                  <h2 className="text-3xl font-serif text-gray-800 mb-4">{isAdmin ? 'Admin' : 'Access'} granted to Murugesa</h2>
                  <p className="text-gray-600 text-lg mb-6">Lifetime membership approved.</p>
                  <div className="space-y-2 italic text-pink-400 text-sm">
                    <p>Since 2022.</p>
                    <p>Since {cityInput}.</p>
                    <p>Since you.</p>
                  </div>
                </FadeIn>
              </div>
            )}
          </div>
        )}

        {/* SCREEN 2: WELCOME */}
        {currentScreen === Screen.WELCOME && (
          <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
            <FadeIn className="max-w-md">
              <h1 className="text-5xl font-serif mb-8 text-gray-800">Hi Murugesa 🌷</h1>
              <div className="space-y-6 text-lg text-gray-600 leading-relaxed font-sans mb-12 px-4">
                <p>Since 2022… my life has been different.</p>
                <p>Better. Softer. Happier.</p>
                <p>I didn’t just build this app.</p>
                <p className="font-medium text-pink-500 italic">I built this for you.</p>
              </div>
              <button 
                onClick={() => setCurrentScreen(Screen.TIMELINE)}
                className="flex items-center gap-2 mx-auto bg-pink-400 text-white font-sans font-bold px-10 py-5 rounded-full shadow-lg active:scale-95 transition-transform"
              >
                Begin Our Story <ChevronRight className="w-5 h-5" />
              </button>
            </FadeIn>
          </div>
        )}

        {/* SCREEN 3: TIMELINE */}
        {currentScreen === Screen.TIMELINE && (
          <div className="min-h-screen p-6 pb-32 max-w-2xl mx-auto flex flex-col pt-16">
            <FadeIn>
              <h2 className="text-4xl font-serif text-center mb-12 text-gray-800">Our Journey</h2>
              <div className="space-y-8">
                {TIMELINE_DATA.map((item, idx) => (
                  <FadeIn key={idx} delay={idx * 200} className="bg-white p-6 rounded-[2rem] shadow-sm border border-pink-50">
                    <h3 className="text-xl font-serif text-pink-500 mb-3">{item.title}</h3>
                    <p className="text-gray-600 leading-relaxed font-sans text-sm md:text-base">{item.text}</p>
                  </FadeIn>
                ))}
              </div>
              <div className="mt-16 flex flex-col gap-4 items-center">
                <button 
                  onClick={() => setCurrentScreen(Screen.GALLERY)}
                  className="w-full max-w-xs bg-white border-2 border-pink-200 text-pink-500 font-sans font-bold py-4 rounded-full flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-transform"
                >
                  <ImageIcon className="w-5 h-5" /> Our Gallery
                </button>
                <button 
                  onClick={() => setCurrentScreen(Screen.REVEAL)}
                  className="w-full max-w-xs bg-pink-400 text-white font-sans font-bold py-4 rounded-full flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
                >
                  Why I Love You <Heart className="w-5 h-5 fill-current" />
                </button>
              </div>
            </FadeIn>
          </div>
        )}

        {/* SCREEN 4: GALLERY */}
        {currentScreen === Screen.GALLERY && (
          <div className="min-h-screen p-6 pb-24 pt-20 max-w-4xl mx-auto flex flex-col w-full">
            <FadeIn className="w-full">
              <div className="flex items-center justify-between mb-8 px-2">
                <h2 className="text-3xl font-serif text-gray-800">Captured Moments</h2>
                {isAdmin && (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 bg-pink-400 text-white rounded-full shadow-lg active:scale-90 transition-transform"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  multiple 
                  onChange={handleFileUpload}
                />
              </div>

              {galleryImages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-pink-300">
                  <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
                  <p className="font-sans italic text-center">No memories uploaded yet...</p>
                  {isAdmin && <p className="text-xs mt-2 opacity-60 text-center">Tap the + to add some!</p>}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 px-2">
                  {galleryImages.map((img, idx) => (
                    <div key={idx} className="relative group aspect-square overflow-hidden rounded-2xl shadow-md bg-pink-50">
                      <img 
                        src={img} 
                        alt="Memory" 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                      />
                      {isAdmin && (
                        <button 
                          onClick={() => deleteImage(idx)}
                          className="absolute top-2 right-2 p-1.5 bg-black/40 text-white rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <button 
                onClick={() => setCurrentScreen(Screen.REVEAL)}
                className="mt-12 mx-auto flex items-center gap-2 bg-pink-100 text-pink-600 font-sans font-bold px-10 py-4 rounded-full active:scale-95 transition-transform"
              >
                Keep Going <ChevronRight className="w-5 h-5" />
              </button>
            </FadeIn>
          </div>
        )}

        {/* SCREEN 5: REVEAL */}
        {currentScreen === Screen.REVEAL && (
          <div className="flex flex-col items-center justify-center min-h-screen p-6 pb-20 text-center">
            <FadeIn className="w-full max-w-lg">
              <div className="mb-10">
                <button 
                  onClick={handleShowRandomMessage}
                  className="group relative inline-flex items-center justify-center p-8 bg-white rounded-full shadow-xl active:scale-95 transition-transform"
                >
                  <Heart className={`w-20 h-20 ${randomMessage ? 'fill-pink-500 text-pink-500' : 'text-pink-200'} transition-colors duration-500`} />
                  <div className="absolute inset-0 rounded-full bg-pink-400 opacity-0 group-hover:animate-ping pointer-events-none"></div>
                </button>
                <p className="mt-4 text-pink-400 font-sans italic animate-pulse text-xs uppercase tracking-widest">Tap the heart to reveal</p>
              </div>

              <div className="min-h-[300px] flex items-start justify-center px-4 w-full">
                {randomMessage && (
                  <div key={randomMessage + randomImageIndex} className="animate-[fadeIn_0.5s_ease-out] flex flex-col items-center w-full">
                    <p className="text-xl md:text-2xl font-serif text-gray-800 leading-relaxed italic mb-8">
                      “{randomMessage}”
                    </p>
                    
                    {randomImageIndex !== null && galleryImages[randomImageIndex] && (
                      <div className="w-full max-w-[280px] p-2 bg-white rounded-xl shadow-2xl border border-pink-50 rotate-[-1deg] transform hover:rotate-0 transition-transform duration-500">
                        <div className="aspect-[4/5] w-full overflow-hidden rounded-lg bg-pink-50">
                          <img 
                            src={galleryImages[randomImageIndex]} 
                            className="w-full h-full object-cover" 
                            alt="Random Memory" 
                          />
                        </div>
                        <div className="h-8 flex items-center justify-center">
                           <Heart className="w-4 h-4 text-pink-200 fill-pink-200" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button 
                onClick={() => setCurrentScreen(Screen.PROPOSAL)}
                className="mt-12 mx-auto flex items-center gap-2 text-pink-300 hover:text-pink-500 font-sans font-medium transition-colors p-4"
              >
                One More Thing… <ChevronRight className="w-4 h-4" />
              </button>
            </FadeIn>
          </div>
        )}

        {/* SCREEN 6: PROPOSAL */}
        {currentScreen === Screen.PROPOSAL && (
          <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-gradient-to-b from-[#FFF5F7] to-pink-100">
            <FadeIn className="max-w-xl">
              {proposalStatus === 'pending' ? (
                <>
                  <div className="space-y-4 mb-10">
                    <p className="text-2xl font-serif text-gray-800">Murugesa…</p>
                    <div className="text-base md:text-lg text-gray-600 leading-relaxed space-y-2">
                      <p>From 2022 in {cityInput === 'madurai' ? 'Grenoble' : cityInput}</p>
                      <p>to every badminton match,</p>
                      <p>to every stressful day,</p>
                      <p>to every laugh we share…</p>
                      <p className="font-semibold text-pink-500 text-xl mt-4">You are my best decision.</p>
                    </div>
                  </div>

                  <h2 className="text-3xl md:text-5xl font-serif mb-12 text-gray-900 leading-tight">
                    Will you be my Valentine?<br/>
                    <span className="text-xl md:text-2xl text-gray-600 block mt-4 italic">And my forever teammate in life? 🏸💍</span>
                  </h2>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
                    <button 
                      onClick={() => handleProposal('yes')}
                      className="bg-white border-2 border-pink-400 text-pink-500 font-sans font-bold py-5 rounded-full shadow-lg active:scale-95 transition-transform w-full sm:px-12"
                    >
                      YES 💖
                    </button>
                    <button 
                      onClick={() => handleProposal('always')}
                      className="bg-pink-500 text-white font-sans font-bold py-5 rounded-full shadow-lg active:scale-95 transition-transform w-full sm:px-12"
                    >
                      ALWAYS ♾️
                    </button>
                  </div>
                </>
              ) : (
                <FadeIn className="text-center">
                  <div className="mb-8 flex justify-center">
                    <CheckCircle2 className="w-20 h-20 text-pink-500 animate-bounce" />
                  </div>
                  <h2 className="text-4xl md:text-5xl font-serif text-gray-800 mb-6 italic px-4">Best decision of my life.</h2>
                  <p className="text-pink-400 font-sans text-xl tracking-widest uppercase mb-12">Ours Forever</p>
                  
                  <button 
                    onClick={() => setCurrentScreen(Screen.DATES)}
                    className="flex items-center gap-2 mx-auto bg-white border-2 border-pink-200 text-pink-500 font-sans font-bold px-8 py-4 rounded-full shadow-md active:scale-95 transition-transform"
                  >
                    More dates to come <ChevronRight className="w-5 h-5" />
                  </button>

                  <div className="mt-12 flex justify-center gap-2">
                     {[...Array(5)].map((_, i) => (
                       <Heart key={i} className="w-6 h-6 fill-pink-300 text-pink-300 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                     ))}
                  </div>
                </FadeIn>
              )}
            </FadeIn>
          </div>
        )}

        {/* SCREEN 7: MORE DATES TO COME */}
        {currentScreen === Screen.DATES && (
          <div className="min-h-screen flex flex-col p-6 pt-20 pb-12 w-full max-w-2xl mx-auto overflow-y-auto">
            <FadeIn className="flex flex-col h-full w-full">
              <h2 className="text-4xl font-serif text-center mb-4 text-gray-800">More dates to come</h2>
              <p className="text-pink-400 text-center font-sans mb-10 italic">Planning our future, one place at a time.</p>

              {/* Add Date Form */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-pink-100 mb-10">
                <h3 className="text-lg font-serif text-gray-700 mb-4">Add a new suggestion</h3>
                <div className="space-y-4">
                  <input 
                    type="text"
                    value={newPlaceName}
                    onChange={(e) => setNewPlaceName(e.target.value)}
                    placeholder="Place name (e.g. Secret Rooftop)"
                    className="w-full p-4 rounded-xl border-pink-100 border-2 focus:border-pink-300 outline-none font-sans text-sm transition-all"
                  />
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-300" />
                      <input 
                        type="text"
                        value={newPlaceLocation}
                        onChange={(e) => setNewPlaceLocation(e.target.value)}
                        placeholder="Location or URL"
                        className="w-full p-4 pl-10 rounded-xl border-pink-100 border-2 focus:border-pink-300 outline-none font-sans text-sm transition-all"
                      />
                    </div>
                    <button 
                      onClick={handleAddDate}
                      className="bg-pink-400 text-white p-4 rounded-xl shadow-lg active:scale-90 transition-transform"
                    >
                      <Plus className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>

              {/* List of Dates */}
              <div className="flex-1 space-y-4">
                {dateSuggestions.length === 0 ? (
                  <div className="text-center py-10 text-pink-200">
                    <MapPin className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-sans italic">Our adventure list is empty...</p>
                  </div>
                ) : (
                  dateSuggestions.map((date) => (
                    <div 
                      key={date.id} 
                      className={`p-5 rounded-2xl border transition-all duration-500 ${date.visited ? 'bg-pink-50/50 border-pink-100' : 'bg-white border-pink-100 shadow-sm'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0 pr-4">
                          <h4 className={`text-lg font-serif truncate ${date.visited ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                            {date.name}
                          </h4>
                          <div className="flex items-center gap-3 mt-1 text-xs text-pink-400">
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {date.location}</span>
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {date.dateAdded}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => toggleVisited(date.id)}
                            className={`p-2 rounded-full transition-colors ${date.visited ? 'text-green-500 bg-green-50' : 'text-pink-300 bg-pink-50'}`}
                          >
                            {date.visited ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                          </button>
                          {isAdmin && (
                            <button 
                              onClick={() => deleteDate(date.id)}
                              className="p-2 text-gray-300 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="mt-12 text-center text-pink-300 text-xs font-sans tracking-widest uppercase">
                To many more adventures together
              </div>
            </FadeIn>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .shadow-soft-pink {
          box-shadow: 0 10px 30px -5px rgba(255, 182, 193, 0.4);
        }
        input::placeholder {
          color: #FBCFE8;
          opacity: 0.6;
        }
        /* Custom hide scrollbar but allow scrolling */
        .overflow-y-auto::-webkit-scrollbar {
          width: 4px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background-color: #FBCFE8;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default App;
