```react
import React, { useState, useEffect, useRef } from 'react';
import {
  Folder, BookOpen, Plus, Lock, Unlock, Cpu, Sparkles, Brain, PlayCircle,
  BarChart2, Settings, CheckCircle, AlertCircle, Trash2, Edit2, RotateCcw,
  Search, Clock, Award, Key, Send, FileText, ArrowRight, X, ChevronRight,
  RefreshCw, Check, Zap, Layers, HelpCircle, Video, Moon, Sun, Filter, UserCheck
} from 'lucide-react';

// --- INITIAL MOCK / PRESETS DATA ---
const INITIAL_DRAWERS = [
  { id: 'd1', name: 'Electromechanical', color: 'from-blue-600 to-indigo-700', icon: 'Cpu' },
  { id: 'd2', name: 'Mathematics & Proofs', color: 'from-emerald-600 to-teal-700', icon: 'Brain' },
  { id: 'd3', name: 'Economics & Finance', color: 'from-amber-600 to-orange-700', icon: 'BarChart2' },
];

const INITIAL_COURSES = [
  {
    id: 'c1',
    drawerId: 'd1',
    title: 'DC Motor Torque Dynamics & Control',
    type: 'Scientific', // Scientific / Engineering
    content: 'Lorentz force equation F = B * I * L. Torque equation T = K_t * I_a. Back-EMF equation E_b = K_e * omega. Kirchhoff voltage law applied to armature: V_a = I_a * R_a + L_a * (dI_a/dt) + E_b. Transfer function derivations and field-oriented control basics.',
    attempts: 3,
    highestScore: 40,
    lastScore: 40,
    status: 'Revision Needed', // 'Revision Needed' | 'Locked' | 'Mastered'
    lockUntil: null,
    recallPeriodHours: 24,
    cognitiveAdvancement: 40,
    weakConcepts: ['Back-EMF Feedback', 'Armature Inductance Effects'],
    chatHistory: [
      { id: 'm1', sender: 'ai', text: 'Welcome to your DC Motor Dynamics companion! Ask me any questions about field control or torque derivations.' }
    ]
  },
  {
    id: 'c2',
    drawerId: 'd2',
    title: 'Fourier Transforms & Spectral Analysis',
    type: 'Scientific',
    content: 'Continuous Fourier Transform definition F(omega) = integral from -inf to +inf of f(t) * e^(-j*omega*t) dt. Inverse transform, linearity, time scaling, frequency shifting, and Parseval theorem proof.',
    attempts: 5,
    highestScore: 85,
    lastScore: 85,
    status: 'Locked',
    lockUntil: Date.now() + 14400000, // Locked for ~4 hours remaining
    recallPeriodHours: 24,
    cognitiveAdvancement: 85,
    weakConcepts: ['Parseval Integration Limits'],
    chatHistory: [
      { id: 'm1', sender: 'ai', text: 'Hello! Ready to analyze spectral bounds or Fourier frequency shifts?' }
    ]
  },
  {
    id: 'c3',
    drawerId: 'd3',
    title: 'Macroeconomic Inflation & Interest Models',
    type: 'Memorization', // Memorization Course
    content: 'Phillips Curve relationship between inflation and unemployment. Quantity Theory of Money (M * V = P * Y). Central Bank monetary transmission mechanisms and reserve ratio dynamics.',
    attempts: 8,
    highestScore: 100,
    lastScore: 100,
    status: 'Mastered',
    lockUntil: null,
    recallPeriodHours: 72,
    cognitiveAdvancement: 100,
    weakConcepts: [],
    chatHistory: [
      { id: 'm1', sender: 'ai', text: 'Congratulations on mastering Macroeconomics! How can I assist you with advanced extensions?' }
    ]
  }
];

// Pre-built fallback questions generator for simulation mode
const MOCK_QUESTION_BANK = {
  Scientific: [
    {
      question: "Derive the relation for Back-EMF ($E_b$) in terms of machine constant $K_e$ and angular speed $\\omega$.",
      options: [
        "$E_b = K_e \\cdot \\omega$",
        "$E_b = K_e / \\omega^2$",
        "$E_b = V_a - I_a^2 R_a$",
        "$E_b = \\int K_e d\\omega$"
      ],
      correct: 0,
      explanation: "Back-EMF is directly proportional to rotor rotational speed: $E_b = K_e \\cdot \\omega$."
    },
    {
      question: "In armature KVL equation $V_a = I_a R_a + L_a \\frac{dI_a}{dt} + E_b$, what term represents the transient inductive voltage drop?",
      options: [
        "$E_b$",
        "$I_a R_a$",
        "$L_a \\frac{dI_a}{dt}$",
        "$V_a$"
      ],
      correct: 2,
      explanation: "The derivative term $L_a \\frac{dI_a}{dt}$ accounts for voltage drop caused by armature self-inductance during current changes."
    },
    {
      question: "Which equation defines the Fourier Transform $F(\\omega)$ of a signal $f(t)$?",
      options: [
        "$F(\\omega) = \\int_{-\\infty}^{\\infty} f(t) e^{-j\\omega t} dt$",
        "$F(\\omega) = \\sum f(t) \\cos(\\omega t)$",
        "$F(\\omega) = \\frac{d}{dt} f(t)$",
        "$F(\\omega) = \\int_{0}^{t} f(\\tau) d\\tau$"
      ],
      correct: 0,
      explanation: "The standard continuous-time Fourier Transform integrates $f(t) e^{-j\\omega t}$ over all time."
    }
  ],
  Memorization: [
    {
      question: "What primary relationship is illustrated by the original short-run Phillips Curve?",
      options: [
        "Inverse relationship between inflation and unemployment",
        "Direct relationship between interest rate and GDP",
        "Inverse relationship between money supply and trade balance",
        "Constant correlation between tax rate and consumer savings"
      ],
      correct: 0,
      explanation: "The short-run Phillips curve shows an empirical inverse tradeoff between wage inflation and unemployment."
    },
    {
      question: "In the Quantity Theory of Money equation $M \\cdot V = P \\cdot Y$, what does $V$ stand for?",
      options: [
        "Velocity of Money",
        "Variable Interest",
        "Value of Imports",
        "Volatility Index"
      ],
      correct: 0,
      explanation: "V represents the Velocity of Money—the average frequency with which a unit of currency is spent."
    }
  ]
};

export default function App() {
  // --- STATES ---
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('GEMINI_API_KEY') || '');
  const [darkMode, setDarkMode] = useState(true);
  const [drawers, setDrawers] = useState(INITIAL_DRAWERS);
  const [courses, setCourses] = useState(INITIAL_COURSES);
  
  // Navigation & Filtering
  const [activeDrawerId, setActiveDrawerId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, Memorization, Scientific

  // Modals & Active Session
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAddDrawerModal, setShowAddDrawerModal] = useState(false);
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [editingDrawer, setEditingDrawer] = useState(null);
  
  // Quiz Session State
  const [activeQuizCourse, setActiveQuizCourse] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null); // { score, passed, weakConcepts }
  const [showRecallLockModal, setShowRecallLockModal] = useState(false);
  const [selectedLockHours, setSelectedLockHours] = useState(24);
  const [customLockHours, setCustomLockHours] = useState(12);

  // Chatbot Drawer State
  const [activeChatCourse, setActiveChatCourse] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [isAiReplying, setIsAiReplying] = useState(false);

  // Add Drawer Form
  const [newDrawerName, setNewDrawerName] = useState('');
  const [newDrawerColor, setNewDrawerColor] = useState('from-blue-600 to-indigo-700');

  // Add Course Form
  const [courseForm, setCourseForm] = useState({
    drawerId: '',
    title: '',
    type: 'Scientific',
    content: '',
    file: null
  });
  const [isParsingCourse, setIsParsingCourse] = useState(false);
  const [parseProgress, setParseProgress] = useState(0);

  // Reference for auto-scrolling chat
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('GEMINI_API_KEY', apiKey);
    } else {
      localStorage.removeItem('GEMINI_API_KEY');
    }
  }, [apiKey]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChatCourse?.chatHistory, isAiReplying]);

  // Dynamic Theme Class Handler
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // --- DRAWER ACTIONS ---
  const handleSaveDrawer = () => {
    if (!newDrawerName.trim()) return;
    if (editingDrawer) {
      setDrawers(drawers.map(d => d.id === editingDrawer.id ? { ...d, name: newDrawerName, color: newDrawerColor } : d));
      setEditingDrawer(null);
    } else {
      const newD = {
        id: 'd_' + Date.now(),
        name: newDrawerName,
        color: newDrawerColor,
        icon: 'Folder'
      };
      setDrawers([...drawers, newD]);
    }
    setNewDrawerName('');
    setShowAddDrawerModal(false);
  };

  const handleDeleteDrawer = (id, e) => {
    e.stopPropagation();
    setDrawers(drawers.filter(d => d.id !== id));
    setCourses(courses.filter(c => c.drawerId !== id));
    if (activeDrawerId === id) setActiveDrawerId('all');
  };

  // --- COURSE ADD & PARSING ---
  const handleCreateCourse = () => {
    if (!courseForm.title || !courseForm.drawerId) return;

    setIsParsingCourse(true);
    setParseProgress(20);

    const interval = setInterval(() => {
      setParseProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 25;
      });
    }, 300);

    setTimeout(() => {
      clearInterval(interval);
      setParseProgress(100);

      const newC = {
        id: 'c_' + Date.now(),
        drawerId: courseForm.drawerId,
        title: courseForm.title,
        type: courseForm.type,
        content: courseForm.content || 'Synthesized course notes on structural mechanisms and definitions.',
        attempts: 0,
        highestScore: 0,
        lastScore: 0,
        status: 'Revision Needed',
        lockUntil: null,
        recallPeriodHours: 24,
        cognitiveAdvancement: 0,
        weakConcepts: ['Initial Assessment Pending'],
        chatHistory: [
          { id: 'm1', sender: 'ai', text: `Course initialized for "${courseForm.title}". Ready for active recall sessions and step-by-step query assistance.` }
        ]
      };

      setCourses(prev => [newC, ...prev]);
      setIsParsingCourse(false);
      setShowAddCourseModal(false);
      setCourseForm({ drawerId: '', title: '', type: 'Scientific', content: '', file: null });
      setParseProgress(0);
    }, 1400);
  };

  // --- GEMINI API CALL OR SIMULATION UTILITY ---
  const callGeminiAPI = async (prompt, systemInstruction = "") => {
    if (!apiKey) return null; // Fall back to simulation

    try {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined
      };

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      return text || null;
    } catch (err) {
      console.error("Gemini API Error:", err);
      return null;
    }
  };

  // --- ACTIVE RECALL QUIZ GENERATION ---
  const startQuizSession = async (course) => {
    setActiveQuizCourse(course);
    setUserAnswers({});
    setCurrentQIndex(0);
    setQuizResult(null);

    // Try Gemini if API Key exists
    let generatedQuestions = null;
    if (apiKey) {
      const prompt = `Generate 3 high-quality multiple choice questions based on the following ${course.type} course notes:
      "${course.content}"
      Return strictly a JSON array of objects with keys: "question", "options" (array of 4 strings), "correct" (index 0-3), "explanation". No markdown codeblocks surrounding JSON if possible.`;

      const aiResponse = await callGeminiAPI(prompt, "You are an expert academic evaluator.");
      if (aiResponse) {
        try {
          const cleanJson = aiResponse.replace(/```json|```/g, '').trim();
          generatedQuestions = JSON.parse(cleanJson);
        } catch (e) {
          console.log("Failed parsing AI JSON quiz, falling back to mock.");
        }
      }
    }

    // Fallback to rich mock bank
    if (!generatedQuestions || !Array.isArray(generatedQuestions)) {
      const mockPool = MOCK_QUESTION_BANK[course.type] || MOCK_QUESTION_BANK.Scientific;
      generatedQuestions = mockPool.map(q => ({
        ...q,
        question: `[${course.type} Focus] ${q.question}`
      }));
    }

    setQuizQuestions(generatedQuestions);
  };

  const handleSelectAnswer = (qIdx, optionIdx) => {
    setUserAnswers({ ...userAnswers, [qIdx]: optionIdx });
  };

  const handleSubmitQuiz = () => {
    let correctCount = 0;
    const weakList = [];

    quizQuestions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correct) {
        correctCount++;
      } else {
        weakList.push(`Question ${idx + 1}: ${q.question.substring(0, 30)}...`);
      }
    });

    const calculatedScore = Math.round((correctCount / quizQuestions.length) * 100);
    const passed = calculatedScore >= 50;

    const result = {
      score: calculatedScore,
      passed,
      weakConcepts: weakList.length > 0 ? weakList : ['None! Perfect comprehension.']
    };

    setQuizResult(result);

    // Update Course Stats
    setCourses(prev => prev.map(c => {
      if (c.id === activeQuizCourse.id) {
        const newAttempts = c.attempts + 1;
        const newHighest = Math.max(c.highestScore, calculatedScore);
        const newStatus = calculatedScore === 100 ? 'Mastered' : (passed ? 'Locked' : 'Revision Needed');
        const cognitive = Math.min(100, Math.round((newHighest * 0.7) + (newAttempts * 5)));

        return {
          ...c,
          attempts: newAttempts,
          highestScore: newHighest,
          lastScore: calculatedScore,
          status: newStatus,
          cognitiveAdvancement: cognitive,
          weakConcepts: passed ? [] : result.weakConcepts
        };
      }
      return c;
    }));

    if (passed && calculatedScore < 100) {
      setShowRecallLockModal(true);
    }
  };

  const handleApplyLockPeriod = (hours) => {
    const lockTime = Date.now() + (hours * 3600 * 1000);
    setCourses(prev => prev.map(c => {
      if (c.id === activeQuizCourse.id) {
        return {
          ...c,
          status: 'Locked',
          lockUntil: lockTime,
          recallPeriodHours: hours
        };
      }
      return c;
    }));
    setShowRecallLockModal(false);
  };

  // --- COURSE CHATBOT / STUDY COMPANION ---
  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || !activeChatCourse) return;

    const userMsg = { id: 'm_' + Date.now(), sender: 'user', text: chatInput };
    const updatedCourse = {
      ...activeChatCourse,
      chatHistory: [...activeChatCourse.chatHistory, userMsg]
    };

    setActiveChatCourse(updatedCourse);
    setCourses(prev => prev.map(c => c.id === activeChatCourse.id ? updatedCourse : c));
    const queryText = chatInput;
    setChatInput('');
    setIsAiReplying(true);

    let replyText = "";
    let ytRecommendation = null;

    if (apiKey) {
      const systemPrompt = `You are a world-class academic tutor specialized in ${activeChatCourse.title} (${activeChatCourse.type} course). Use formulas formatted cleanly or step-by-step reasoning. Give concise, highly clear explanations.`;
      const aiResponse = await callGeminiAPI(`Context: ${activeChatCourse.content}\nUser Question: ${queryText}`, systemPrompt);
      if (aiResponse) {
        replyText = aiResponse;
      }
    }

    if (!replyText) {
      // Synthetic academic response simulation
      replyText = `**Academic Breakdown for "${queryText}":**\n\n1. **Core Principle:** In ${activeChatCourse.title}, we apply fundamental conservation equations.\n2. **Mathematical Formulation:**\n   $$\\nabla \\times \\mathbf{E} = -\\frac{\\partial \\mathbf{B}}{\\partial t}$$\n3. **Practical Application:** This holds key relevance when auditing transient impedance or dynamic stability.`;
    }

    // Attach synthetic video recommendation if relevant
    if (queryText.toLowerCase().includes('torque') || queryText.toLowerCase().includes('fourier') || queryText.toLowerCase().includes('inflation') || queryText.toLowerCase().includes('how') || queryText.toLowerCase().includes('video')) {
      ytRecommendation = {
        title: `Mastering ${queryText.slice(0, 25)}... (Academic Video Overview)`,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(activeChatCourse.title + " " + queryText)}`,
        channel: 'MIT OpenCourseWare / Stanford Online'
      };
    }

    const aiMsg = {
      id: 'm_' + (Date.now() + 1),
      sender: 'ai',
      text: replyText,
      ytVideo: ytRecommendation
    };

    setTimeout(() => {
      const finalCourseState = {
        ...updatedCourse,
        chatHistory: [...updatedCourse.chatHistory, aiMsg]
      };
      setActiveChatCourse(finalCourseState);
      setCourses(prev => prev.map(c => c.id === activeChatCourse.id ? finalCourseState : c));
      setIsAiReplying(false);
    }, 800);
  };

  // --- FILTERED COURSES ---
  const filteredCourses = courses.filter(c => {
    const matchesDrawer = activeDrawerId === 'all' || c.drawerId === activeDrawerId;
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || c.type === filterType;
    return matchesDrawer && matchesSearch && matchesType;
  });

  // Calculate global stats
  const totalCourses = courses.length;
  const totalMastered = courses.filter(c => c.status === 'Mastered').length;
  const avgCognitive = totalCourses > 0 ? Math.round(courses.reduce((acc, c) => acc + c.cognitiveAdvancement, 0) / totalCourses) : 0;

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* Top Academic Header / Navigation Bar */}
      <header className={`sticky top-0 z-30 border-b backdrop-blur-md transition-colors ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-xl shadow-md text-white">
              <Brain className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
                AetherRecall <span className="text-xs font-normal text-slate-400 border border-slate-700 px-1.5 py-0.5 rounded ml-2">v2.4 Academic</span>
              </h1>
              <p className="text-xs text-slate-400">Spaced Repetition & Cognitive AI Library</p>
            </div>
          </div>

          {/* Quick Actions & API Key status */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowSettingsModal(true)}
              className={`flex items-center space-x-2 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                apiKey 
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' 
                  : 'border-amber-500/50 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>{apiKey ? 'Gemini AI Active' : 'Simulation Mode'}</span>
   
