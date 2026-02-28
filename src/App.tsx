import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  GraduationCap, 
  Users, 
  Plus, 
  ChevronRight, 
  LogOut, 
  LayoutDashboard, 
  FileText, 
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BrainCircuit,
  Trash2,
  Library
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { User, Lesson, ProgressRecord } from './types';
import { CURRICULUM_TOPICS } from './constants/curriculum';
import { generateLesson } from './services/geminiService';

// --- Components ---

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, loading = false }: any) => {
  const variants: any = {
    primary: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
    secondary: 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50',
    ghost: 'text-stone-600 hover:bg-stone-100',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100'
  };

  return (
    <button
      disabled={disabled || loading}
      onClick={onClick}
      className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
};

const Card = ({ children, className = '' }: any) => (
  <div className={`bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden ${className}`}>
    {children}
  </div>
);

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'login' | 'dashboard' | 'lesson' | 'report' | 'create' | 'curriculum'>('login');
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<ProgressRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loginRole, setLoginRole] = useState<'parent' | 'student'>('parent');
  const [assigningToStudent, setAssigningToStudent] = useState<User | null>(null);

  const handleSignOut = () => {
    setUser(null);
    setView('login');
    setSelectedStudent(null);
    setStudents([]);
    setLessons([]);
    setActiveLesson(null);
    setProgress([]);
    setAssigningToStudent(null);
  };

  // Login Logic
  const handleLogin = async (identifier: string, role: 'parent' | 'student') => {
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, role })
      });
      const userData = await res.json();
      setUser(userData);
      setView('dashboard');
    } catch (error) {
      console.error('Login failed', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Data
  useEffect(() => {
    if (user) {
      if (user.role === 'parent') {
        fetch(`/api/students/${user.id}`).then(res => res.json()).then(setStudents);
      } else {
        fetch(`/api/lessons/${user.gradeLevel}?studentId=${user.id}`).then(res => res.json()).then(setLessons);
        fetch(`/api/progress/${user.id}`).then(res => res.json()).then(setProgress);
      }
    }
  }, [user]);

  const handleRemoveStudent = async (id: number) => {
    if (!confirm('Are you sure you want to remove this student? All their progress will be lost.')) return;
    const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setStudents(students.filter(s => s.id !== id));
    }
  };

  const handleAddStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      gradeLevel: formData.get('grade'),
      parentId: user?.id
    };
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      const updated = await fetch(`/api/students/${user?.id}`).then(r => r.json());
      setStudents(updated);
      (e.target as HTMLFormElement).reset();
    }
  };

  const handleCreateLesson = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const subject = formData.get('subject') as string;
    const grade = formData.get('grade') as string;
    const topic = formData.get('topic') as string;

    try {
      const aiLesson = await generateLesson(subject, grade, topic);
      const res = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: aiLesson.title,
          subject,
          grade_level: grade,
          content: aiLesson.content,
          quiz_json: aiLesson.quiz,
          student_id: assigningToStudent?.id
        })
      });
      if (res.ok) {
        alert(`Successfully assigned "${aiLesson.title}" to ${assigningToStudent ? assigningToStudent.name : 'Grade ' + grade}!`);
        setAssigningToStudent(null);
        setView('dashboard');
      }
    } catch (error) {
      console.error('Lesson generation failed', error);
    } finally {
      setLoading(false);
    }
  };

  const startLesson = async (id: number) => {
    setLoading(true);
    const res = await fetch(`/api/lesson/${id}`);
    const data = await res.json();
    setActiveLesson(data);
    setView('lesson');
    setLoading(false);
  };

  if (view === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-600 text-white mb-4">
              <GraduationCap size={32} />
            </div>
            <h1 className="text-3xl font-serif font-bold text-stone-900">Lumina Academy</h1>
            <p className="text-stone-500 mt-2">Personalized AI Home Education</p>
          </div>

          <Card className="p-8">
            <form onSubmit={(e) => {
              e.preventDefault();
              const identifier = (e.currentTarget.elements.namedItem('identifier') as HTMLInputElement).value;
              const role = loginRole;
              handleLogin(identifier, role);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    {loginRole === 'student' ? 'Student Name' : 'Name or Email'}
                  </label>
                  <input 
                    name="identifier"
                    type="text" 
                    required
                    placeholder={loginRole === 'student' ? 'Enter your name' : 'Enter your name or email'}
                    className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">I am a...</label>
                  <select 
                    name="role"
                    value={loginRole}
                    onChange={(e) => setLoginRole(e.target.value as 'parent' | 'student')}
                    className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all bg-white"
                  >
                    <option value="parent">Parent / Teacher</option>
                    <option value="student">Student</option>
                  </select>
                </div>
                <Button loading={loading} className="w-full py-3 mt-4">
                  Sign In
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-stone-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-stone-200 flex flex-col">
        <div className="p-6 border-bottom border-stone-100">
          <div className="flex items-center gap-3 text-emerald-600">
            <GraduationCap size={24} />
            <span className="font-serif font-bold text-xl text-stone-900">Lumina</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Button 
            variant={view === 'dashboard' ? 'primary' : 'ghost'} 
            className="w-full justify-start"
            onClick={() => {
              setAssigningToStudent(null);
              setView('dashboard');
            }}
          >
            <LayoutDashboard size={18} /> Dashboard
          </Button>
          
          {user?.role === 'parent' && (
            <>
              <Button 
                variant={view === 'create' ? 'primary' : 'ghost'} 
                className="w-full justify-start"
                onClick={() => setView('create')}
              >
                <BrainCircuit size={18} /> Create Lesson
              </Button>
              <Button 
                variant={view === 'curriculum' ? 'primary' : 'ghost'} 
                className="w-full justify-start"
                onClick={() => setView('curriculum')}
              >
                <BookOpen size={18} /> AI Curriculum
              </Button>
            </>
          )}

          {user?.role === 'student' && (
            <Button 
              variant={view === 'report' ? 'primary' : 'ghost'} 
              className="w-full justify-start"
              onClick={() => setView('report')}
            >
              <BarChart3 size={18} /> My Progress
            </Button>
          )}
        </nav>

        <div className="p-4 border-t border-stone-100">
          <div className="flex items-center gap-3 p-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 font-bold">
              {user?.name[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-900 truncate">{user?.name}</p>
              <p className="text-xs text-stone-500 truncate capitalize">{user?.role}</p>
            </div>
          </div>
          <Button variant="danger" className="w-full" onClick={handleSignOut}>
            <LogOut size={16} /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-5xl mx-auto"
            >
              <header className="mb-8">
                <h2 className="text-3xl font-serif font-bold text-stone-900">
                  Welcome back, {user?.name}!
                </h2>
                <p className="text-stone-500">Here's what's happening in your academy.</p>
              </header>

              {user?.role === 'parent' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Users size={20} className="text-emerald-600" /> My Students
                      </h3>
                    </div>
                    <div className="space-y-4">
                      {students.map(student => (
                        <Card key={student.id} className="p-4 hover:border-emerald-200 transition-colors group">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => {
                              setSelectedStudent(student);
                              fetch(`/api/progress/${student.id}`).then(res => res.json()).then(setProgress);
                              setView('report');
                            }}>
                              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                                {student.name[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-stone-900">{student.name}</p>
                                <p className="text-sm text-stone-500">Grade {student.gradeLevel}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                className="p-2 text-emerald-600 hover:bg-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                                onClick={(e: any) => {
                                  e.stopPropagation();
                                  setAssigningToStudent(student);
                                  setView('curriculum');
                                }}
                              >
                                <Plus size={16} /> <span className="text-xs">Assign</span>
                              </Button>
                              <Button 
                                variant="ghost" 
                                className="p-2 text-blue-600 hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                                onClick={(e: any) => {
                                  e.stopPropagation();
                                  setAssigningToStudent(student);
                                  setView('create');
                                }}
                              >
                                <BrainCircuit size={16} /> <span className="text-xs">Create</span>
                              </Button>
                              <Button 
                                variant="ghost" 
                                className="p-2 text-stone-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e: any) => {
                                  e.stopPropagation();
                                  handleRemoveStudent(student.id);
                                }}
                              >
                                <Trash2 size={18} />
                              </Button>
                              <ChevronRight size={20} className="text-stone-300" />
                            </div>
                          </div>
                        </Card>
                      ))}
                      
                      <Card className="p-6 bg-stone-50 border-dashed border-2">
                        <h4 className="font-medium mb-4">Add New Student</h4>
                        <form onSubmit={handleAddStudent} className="space-y-3">
                          <input name="name" placeholder="Student Name" required className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm" />
                          <select name="grade" required className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm bg-white">
                            <option value="">Select Grade</option>
                            {Array.from({length: 13}, (_, i) => i === 0 ? 'K' : i.toString()).map(g => (
                              <option key={g} value={g}>Grade {g}</option>
                            ))}
                          </select>
                          <Button className="w-full text-sm">
                            <Plus size={16} /> Add Student
                          </Button>
                        </form>
                      </Card>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <BookOpen size={20} className="text-emerald-600" /> Quick Actions
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      <Card className="p-6 bg-emerald-600 text-white">
                        <BrainCircuit size={32} className="mb-4 opacity-80" />
                        <h4 className="text-xl font-bold mb-2">AI Lesson Builder</h4>
                        <p className="text-emerald-50 mb-4 text-sm">Generate custom, grade-specific lessons in seconds using Gemini AI.</p>
                        <div className="space-y-2">
                          <Button variant="secondary" className="w-full bg-white text-emerald-700 border-none" onClick={() => setView('create')}>
                            Build New Lesson
                          </Button>
                          <Button 
                            variant="ghost" 
                            className="w-full text-white border border-white/20 hover:bg-white/10" 
                            loading={loading}
                            onClick={async () => {
                              setLoading(true);
                              const grades = ["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
                              
                              for (const grade of grades) {
                                const topics = CURRICULUM_TOPICS[grade];
                                const item = topics[Math.floor(Math.random() * topics.length)];
                                try {
                                  const aiLesson = await generateLesson(item.subject, grade, item.topic);
                                  await fetch('/api/lessons', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      title: aiLesson.title,
                                      subject: item.subject,
                                      grade_level: grade,
                                      content: aiLesson.content,
                                      quiz_json: aiLesson.quiz
                                    })
                                  });
                                } catch (e) {
                                  console.error(`Failed to seed grade ${grade}`, e);
                                }
                              }
                              setLoading(false);
                              alert("Sample lessons assigned to all grades!");
                            }}
                          >
                            Auto-Assign All Grades
                          </Button>
                        </div>
                      </Card>
                    </div>
                  </section>
                </div>
              ) : (
                <div className="space-y-8">
                  <section>
                    <h3 className="text-lg font-semibold mb-4">Available Lessons</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {lessons.length === 0 ? (
                        <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-dashed border-stone-200">
                          <BookOpen size={48} className="mx-auto text-stone-300 mb-4" />
                          <p className="text-stone-500">No lessons assigned yet. Ask your teacher to create one!</p>
                        </div>
                      ) : (
                        lessons.map(lesson => (
                          <Card key={lesson.id} className="p-6 hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-4">
                              <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded uppercase tracking-wider">
                                {lesson.subject}
                              </span>
                              <span className="text-xs text-stone-400">
                                {new Date(lesson.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <h4 className="text-xl font-serif font-bold text-stone-900 mb-2">{lesson.title}</h4>
                            <p className="text-stone-500 text-sm mb-6 line-clamp-2">
                              {lesson.content.substring(0, 100)}...
                            </p>
                            <Button className="w-full" onClick={() => startLesson(lesson.id)}>
                              Start Lesson
                            </Button>
                          </Card>
                        ))
                      )}
                    </div>
                  </section>
                </div>
              )}
            </motion.div>
          )}

          {view === 'curriculum' && (
            <motion.div 
              key="curriculum"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-5xl mx-auto"
            >
              <header className="mb-8">
                <Button variant="ghost" className="mb-4" onClick={() => {
                  setAssigningToStudent(null);
                  setView('dashboard');
                }}>
                  ← Back to Dashboard
                </Button>
                <h2 className="text-3xl font-serif font-bold text-stone-900">AI Curriculum Explorer</h2>
                <p className="text-stone-500">
                  {assigningToStudent 
                    ? `Assigning lesson specifically to ${assigningToStudent.name} (Grade ${assigningToStudent.gradeLevel})`
                    : 'Choose from pre-defined topics for each grade level to generate instant AI lessons.'}
                </p>
              </header>

              <div className="space-y-12">
                {Object.entries(CURRICULUM_TOPICS)
                  .filter(([grade]) => !assigningToStudent || grade === assigningToStudent.gradeLevel)
                  .map(([grade, topics]) => (
                  <section key={grade}>
                    <h3 className="text-xl font-bold text-stone-900 mb-4 border-b border-stone-200 pb-2">
                      Grade {grade}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {topics.map((item, idx) => (
                        <Card key={idx} className="p-5 hover:border-emerald-200 transition-all flex flex-col justify-between">
                          <div>
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded uppercase tracking-wider mb-2 inline-block">
                              {item.subject}
                            </span>
                            <h4 className="font-medium text-stone-900 mb-4">{item.topic}</h4>
                          </div>
                          <Button 
                            variant="secondary" 
                            className="w-full text-sm"
                            loading={loading}
                            onClick={async () => {
                              setLoading(true);
                              try {
                                const aiLesson = await generateLesson(item.subject, grade, item.topic);
                                const res = await fetch('/api/lessons', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    title: aiLesson.title,
                                    subject: item.subject,
                                    grade_level: grade,
                                    content: aiLesson.content,
                                    quiz_json: aiLesson.quiz,
                                    student_id: assigningToStudent?.id
                                  })
                                });
                                if (res.ok) {
                                  alert(`Successfully assigned "${aiLesson.title}" to ${assigningToStudent ? assigningToStudent.name : 'Grade ' + grade}!`);
                                  if (assigningToStudent) {
                                    setAssigningToStudent(null);
                                    setView('dashboard');
                                  }
                                }
                              } catch (e) {
                                console.error(e);
                              } finally {
                                setLoading(false);
                              }
                            }}
                          >
                            <Plus size={14} /> Assign to Grade
                          </Button>
                        </Card>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </motion.div>
          )}

          {view === 'create' && (
            <motion.div 
              key="create"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto"
            >
              <header className="mb-8">
                <Button variant="ghost" className="mb-4" onClick={() => {
                  setAssigningToStudent(null);
                  setView('dashboard');
                }}>
                  ← Back to Dashboard
                </Button>
                <h2 className="text-3xl font-serif font-bold text-stone-900">AI Lesson Builder</h2>
                <p className="text-stone-500">
                  {assigningToStudent 
                    ? `Creating custom lesson for ${assigningToStudent.name}`
                    : 'Describe the topic, and our AI will craft a complete lesson and quiz.'}
                </p>
              </header>

              <Card className="p-8">
                <form onSubmit={handleCreateLesson} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">Subject</label>
                      <select name="subject" required className="w-full px-4 py-2 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                        <option value="Math">Math</option>
                        <option value="Reading">Reading</option>
                        <option value="Language arts">Language arts</option>
                        <option value="Science">Science</option>
                        <option value="Social studies">Social studies</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">Grade Level</label>
                      {assigningToStudent && <input type="hidden" name="grade" value={assigningToStudent.gradeLevel} />}
                      <select 
                        name="grade" 
                        required 
                        defaultValue={assigningToStudent?.gradeLevel || ""}
                        disabled={!!assigningToStudent}
                        className="w-full px-4 py-2 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-emerald-500 bg-white disabled:bg-stone-50 disabled:text-stone-500"
                      >
                        {Array.from({length: 13}, (_, i) => i === 0 ? 'K' : i.toString()).map(g => (
                          <option key={g} value={g}>Grade {g}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Lesson Topic</label>
                    <input 
                      name="topic"
                      required
                      placeholder="e.g., Photosynthesis, The Roman Empire, Fractions..."
                      className="w-full px-4 py-2 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-xl flex gap-3 items-start">
                    <BrainCircuit className="text-emerald-600 mt-1 shrink-0" size={20} />
                    <p className="text-sm text-emerald-800">
                      Gemini AI will generate a structured lesson with educational content and a 5-question quiz based on your input.
                    </p>
                  </div>
                  <Button loading={loading} className="w-full py-4 text-lg">
                    Assign Lesson to Grade
                  </Button>
                </form>
              </Card>
            </motion.div>
          )}

          {view === 'lesson' && activeLesson && (
            <LessonPlayer 
              lesson={activeLesson} 
              studentId={user!.id} 
              onComplete={() => {
                setView('report');
                fetch(`/api/progress/${user!.id}`).then(res => res.json()).then(setProgress);
              }}
              onClose={() => setView('dashboard')}
            />
          )}

          {view === 'report' && (
            <motion.div 
              key="report"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto"
            >
              <header className="mb-8 flex justify-between items-end">
                <div>
                  <Button variant="ghost" className="mb-4" onClick={() => setView('dashboard')}>
                    ← Back to Dashboard
                  </Button>
                  <h2 className="text-3xl font-serif font-bold text-stone-900">
                    {selectedStudent ? `${selectedStudent.name}'s Progress` : 'My Progress Report'}
                  </h2>
                  <p className="text-stone-500">Tracking growth and achievements over time.</p>
                </div>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="p-6">
                  <p className="text-stone-500 text-sm mb-1">Lessons Completed</p>
                  <p className="text-4xl font-bold text-emerald-600">{progress.length}</p>
                </Card>
                <Card className="p-6">
                  <p className="text-stone-500 text-sm mb-1">Average Score</p>
                  <p className="text-4xl font-bold text-stone-900">
                    {progress.length > 0 
                      ? Math.round(progress.reduce((acc, curr) => acc + curr.score, 0) / progress.length) 
                      : 0}%
                  </p>
                </Card>
                <Card className="p-6">
                  <p className="text-stone-500 text-sm mb-1">Top Subject</p>
                  <p className="text-4xl font-bold text-stone-900">
                    {progress.length > 0 ? progress[0].subject : 'N/A'}
                  </p>
                </Card>
              </div>

              <Card>
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-100">
                      <th className="px-6 py-4 text-sm font-semibold text-stone-600">Lesson</th>
                      <th className="px-6 py-4 text-sm font-semibold text-stone-600">Subject</th>
                      <th className="px-6 py-4 text-sm font-semibold text-stone-600">Date</th>
                      <th className="px-6 py-4 text-sm font-semibold text-stone-600">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {progress.map(record => (
                      <tr key={record.id} className="hover:bg-stone-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-stone-900">{record.title}</td>
                        <td className="px-6 py-4 text-stone-500">{record.subject}</td>
                        <td className="px-6 py-4 text-stone-500">
                          {new Date(record.completed_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            record.score >= 80 ? 'bg-emerald-50 text-emerald-700' : 
                            record.score >= 60 ? 'bg-amber-50 text-amber-700' : 
                            'bg-red-50 text-red-700'
                          }`}>
                            {record.score}%
                          </span>
                        </td>
                      </tr>
                    ))}
                    {progress.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-stone-400 italic">
                          No progress records found yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// --- Lesson Player Component ---

function LessonPlayer({ lesson, studentId, onComplete, onClose }: { lesson: Lesson, studentId: number, onComplete: () => void, onClose: () => void }) {
  const [step, setStep] = useState<'reading' | 'quiz' | 'result'>('reading');
  const [answers, setAnswers] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleQuizSubmit = async () => {
    let correct = 0;
    lesson.quiz_json.forEach((q: any, idx: number) => {
      if (answers[idx] === q.correctAnswer) correct++;
    });
    const finalScore = Math.round((correct / lesson.quiz_json.length) * 100);
    setScore(finalScore);
    setStep('result');
    
    setLoading(true);
    await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: studentId,
        lesson_id: lesson.id,
        score: finalScore
      })
    });
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <header className="mb-8 flex justify-between items-center sticky top-0 bg-stone-50/80 backdrop-blur py-4 z-10">
        <Button variant="ghost" onClick={onClose}>Exit Lesson</Button>
        <div className="flex gap-2">
          <div className={`w-3 h-3 rounded-full ${step === 'reading' ? 'bg-emerald-600' : 'bg-emerald-200'}`} />
          <div className={`w-3 h-3 rounded-full ${step === 'quiz' ? 'bg-emerald-600' : 'bg-emerald-200'}`} />
          <div className={`w-3 h-3 rounded-full ${step === 'result' ? 'bg-emerald-600' : 'bg-emerald-200'}`} />
        </div>
      </header>

      <AnimatePresence mode="wait">
        {step === 'reading' && (
          <motion.div 
            key="reading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="p-12">
              <div className="lesson-content">
                <Markdown>{lesson.content}</Markdown>
              </div>
              <div className="mt-12 pt-12 border-t-2 border-dashed border-stone-200 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4">
                  <FileText size={32} />
                </div>
                <h3 className="text-2xl font-serif font-bold text-stone-900 mb-2">Ready for the Quiz?</h3>
                <p className="text-stone-500 mb-8 max-w-md mx-auto">
                  Great job reading! Now let's test your knowledge with a quick 5-question quiz to see what you've learned.
                </p>
                <Button onClick={() => setStep('quiz')} className="px-12 py-4 text-xl shadow-lg hover:scale-105 transition-transform">
                  Start Quiz Now <ChevronRight size={24} />
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {step === 'quiz' && (
          <motion.div 
            key="quiz"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <h2 className="text-2xl font-serif font-bold mb-6">Check Your Understanding</h2>
            <div className="space-y-8">
              {lesson.quiz_json.map((q: any, qIdx: number) => (
                <Card key={qIdx} className="p-6">
                  <p className="font-medium text-lg mb-4">{qIdx + 1}. {q.question}</p>
                  <div className="grid grid-cols-1 gap-3">
                    {q.options.map((opt: string, oIdx: number) => (
                      <button
                        key={oIdx}
                        onClick={() => {
                          const newAnswers = [...answers];
                          newAnswers[qIdx] = oIdx;
                          setAnswers(newAnswers);
                        }}
                        className={`text-left px-4 py-3 rounded-xl border transition-all ${
                          answers[qIdx] === oIdx 
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500' 
                            : 'bg-white border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
            <div className="mt-8 flex justify-end">
              <Button 
                disabled={answers.length < lesson.quiz_json.length || answers.includes(undefined as any)}
                onClick={handleQuizSubmit}
                className="px-12 py-4 text-lg"
                loading={loading}
              >
                Submit Quiz
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'result' && (
          <motion.div 
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 ${
              score >= 80 ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
            }`}>
              {score >= 80 ? <CheckCircle2 size={48} /> : <AlertCircle size={48} />}
            </div>
            <h2 className="text-4xl font-serif font-bold mb-2">Lesson Complete!</h2>
            <p className="text-xl text-stone-500 mb-8">You scored {score}% on the quiz.</p>
            
            <div className="max-w-md mx-auto space-y-4">
              <Card className="p-6 bg-white">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-stone-500">Accuracy</span>
                  <span className="font-bold">{score}%</span>
                </div>
                <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    className={`h-full ${score >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  />
                </div>
              </Card>
              
              <Button onClick={onComplete} className="w-full py-4">
                View My Progress Report
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
