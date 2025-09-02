
import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI, Type } from "@google/genai";

// --- AI INITIALIZATION ---
const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

// --- TYPE DEFINITIONS ---
interface Internship {
  id: number;
  title: string;
  company: string;
  domain: string;
  requiredSkills: string[];
  description: string;
  location: string;
  alumniFrom?: string[]; // New: For alumni network feature
}

interface InternshipWithReason extends Internship {
  reason: string;
}

interface User {
  email: string;
  password: string; // In a real app, NEVER store plain text passwords.
  savedInternshipIds: number[];
  college: string;
  major: string;
  gradYear: string;
  preferences: {
      domains: string[];
      location: string;
  }
}

// --- HARDCODED FAKE DATA ---
const INTERNSHIPS_DATA: Internship[] = [
  {
    id: 1,
    title: 'Frontend Developer Intern',
    company: 'Innovate Inc.',
    domain: 'Web Development',
    requiredSkills: ['React', 'TypeScript', 'Tailwind CSS', 'HTML', 'CSS'],
    description: 'Work on building and maintaining our user-facing web applications using modern technologies.',
    location: 'Remote',
    alumniFrom: ['Stanford University', 'UC Berkeley']
  },
  {
    id: 2,
    title: 'Data Science Intern',
    company: 'DataDriven Co.',
    domain: 'Data Science',
    requiredSkills: ['Python', 'Pandas', 'NumPy', 'Scikit-learn', 'SQL'],
    description: 'Analyze large datasets to extract meaningful insights and build predictive models.',
    location: 'New York, NY',
    alumniFrom: ['Columbia University', 'NYU']
  },
  {
    id: 3,
    title: 'Backend Engineer Intern',
    company: 'ServerSide Solutions',
    domain: 'Web Development',
    requiredSkills: ['Node.js', 'Express', 'MongoDB', 'REST APIs'],
    description: 'Develop and maintain server-side logic, define and maintain databases, and ensure high performance.',
    location: 'San Francisco, CA',
    alumniFrom: ['IIT Bombay', 'Carnegie Mellon University']
  },
  {
    id: 4,
    title: 'UX/UI Design Intern',
    company: 'Creative Minds Studio',
    domain: 'Design',
    requiredSkills: ['Figma', 'Adobe XD', 'User Research', 'Prototyping'],
    description: 'Create intuitive and visually appealing user interfaces for our mobile and web products.',
    location: 'Remote',
    alumniFrom: ['Rhode Island School of Design', 'UC Berkeley']
  },
  {
    id: 5,
    title: 'Machine Learning Intern',
    company: 'AI Forward',
    domain: 'Machine Learning',
    requiredSkills: ['Python', 'TensorFlow', 'PyTorch', 'Computer Vision'],
    description: 'Research and implement machine learning models for image recognition and natural language processing.',
    location: 'Austin, TX',
    alumniFrom: ['University of Texas at Austin', 'MIT']
  },
  {
    id: 6,
    title: 'Mobile App Developer Intern (iOS)',
    company: 'AppMakers',
    domain: 'Mobile Development',
    requiredSkills: ['Swift', 'SwiftUI', 'Xcode', 'Git'],
    description: 'Join our iOS team to build new features for our popular mobile application.',
    location: 'Remote',
    alumniFrom: ['University of Illinois Urbana-Champaign']
  },
  {
    id: 7,
    title: 'Full-Stack Developer Intern',
    company: 'Tech Giants',
    domain: 'Web Development',
    requiredSkills: ['React', 'Node.js', 'PostgreSQL', 'Docker'],
    description: 'Contribute to both frontend and backend development of our core platform.',
    location: 'Seattle, WA',
    alumniFrom: ['University of Washington', 'MIT']
  },
  {
    id: 8,
    title: 'Cloud Engineer Intern',
    company: 'SkyHigh Cloud',
    domain: 'Cloud Computing',
    requiredSkills: ['AWS', 'Terraform', 'Kubernetes', 'CI/CD'],
    description: 'Help manage and scale our cloud infrastructure on AWS, focusing on automation and reliability.',
    location: 'Remote',
    alumniFrom: ['Georgia Institute of Technology', 'Carnegie Mellon University']
  },
];


// --- SVG ICONS ---
const SearchIcon: React.FC<{ className?: string }> = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>);
const BriefcaseIcon: React.FC<{ className?: string }> = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>);
const LocationIcon: React.FC<{ className?: string }> = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>);
const BookmarkIcon: React.FC<{ className?: string; isSaved: boolean; }> = ({ className, isSaved }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill={isSaved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>);
const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.293 2.293a1 1 0 010 1.414L10 12l-2.293 2.293a1 1 0 01-1.414 0L4 12m16 8l-2.293-2.293a1 1 0 00-1.414 0L14 16l-2.293-2.293a1 1 0 00-1.414 0L8 16m11-6a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1h2a1 1 0 001-1v-2z" /></svg>);
const UsersIcon: React.FC<{ className?: string }> = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.124-1.282-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.124-1.282.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>);


// --- REUSABLE COMPONENTS ---
const SkillTag: React.FC<{ skill: string }> = ({ skill }) => ( <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-semibold mr-2 mb-2 px-2.5 py-1 rounded-full">{skill}</span>);

const InternshipCard: React.FC<{ internship: InternshipWithReason, isSaved: boolean, onSave: (id: number) => void }> = ({ internship, isSaved, onSave }) => (
  <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 ease-in-out p-6 flex flex-col h-full relative">
     <button onClick={() => onSave(internship.id)} className="absolute top-4 right-4 text-gray-400 hover:text-indigo-600 transition-colors" aria-label="Save internship">
        <BookmarkIcon className="h-6 w-6" isSaved={isSaved} />
     </button>
    <div className="flex-grow pr-8">
      <h3 className="text-xl font-bold text-gray-800">{internship.title}</h3>
      <div className="flex items-center text-gray-500 mt-2 mb-3">
        <BriefcaseIcon className="h-4 w-4 mr-2" />
        <p>{internship.company}</p>
        <span className="mx-2">|</span>
        <LocationIcon className="h-4 w-4 mr-1.5" />
        <p>{internship.location}</p>
      </div>
      <p className="text-gray-600 text-sm mb-4">{internship.description}</p>
      <h4 className="text-sm font-semibold text-gray-700 mb-2">Required Skills:</h4>
      <div className="flex flex-wrap mb-4">
          {internship.requiredSkills.map(skill => <SkillTag key={skill} skill={skill} />)}
      </div>
    </div>
    <div className="mt-auto pt-4 border-t border-indigo-100 bg-indigo-50 -m-6 px-6 pb-6 rounded-b-lg">
      <p className="text-sm font-semibold text-indigo-800">✨ AI Recommendation</p>
      <p className="text-sm text-indigo-700 italic mt-1">"{internship.reason}"</p>
    </div>
  </div>
);

const AuthModal: React.FC<{ mode: 'login' | 'signup', onClose: () => void, onAuthSuccess: (user: {email: string}) => void }> = ({ mode, onClose, onAuthSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    
    // Signup specific fields
    const [college, setCollege] = useState('');
    const [major, setMajor] = useState('');
    const [gradYear, setGradYear] = useState('');
    const [prefDomains, setPrefDomains] = useState('');
    const [prefLocation, setPrefLocation] = useState('Remote');

    const title = mode === 'login' ? 'Log In' : 'Create Your Profile';
    const buttonText = mode === 'login' ? 'Log In' : 'Create Account';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!email || !password) {
            setError('Email and Password are required.');
            return;
        }

        const users: { [email: string]: User } = JSON.parse(localStorage.getItem('internai_users') || '{}');

        if (mode === 'signup') {
            if (!college || !major || !gradYear || !prefDomains) {
                setError('Please fill out all profile fields.');
                return;
            }
            if (users[email]) {
                setError('An account with this email already exists.');
                return;
            }
            const newUser: User = {
                email,
                password,
                savedInternshipIds: [],
                college,
                major,
                gradYear,
                preferences: {
                    domains: prefDomains.split(',').map(s => s.trim()),
                    location: prefLocation
                }
            };
            users[email] = newUser;
            localStorage.setItem('internai_users', JSON.stringify(users));
            onAuthSuccess({ email });
        } else { // login
            const user = users[email];
            if (!user || user.password !== password) {
                setError('Invalid email or password.');
                return;
            }
            onAuthSuccess({ email });
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={onClose}>
            <div className="bg-white rounded-lg p-8 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-center mb-6">{title}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label className="block text-gray-700 mb-1 text-sm font-medium" htmlFor="email">Email</label>
                        <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                     <div>
                        <label className="block text-gray-700 mb-1 text-sm font-medium" htmlFor="password">Password</label>
                        <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>

                    {mode === 'signup' && (
                        <>
                            <hr className="my-6"/>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-700 mb-1 text-sm font-medium" htmlFor="college">College/University</label>
                                    <input type="text" id="college" placeholder="e.g., Stanford University" value={college} onChange={e => setCollege(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-gray-700 mb-1 text-sm font-medium" htmlFor="major">Major</label>
                                    <input type="text" id="major" placeholder="e.g., Computer Science" value={major} onChange={e => setMajor(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-gray-700 mb-1 text-sm font-medium" htmlFor="gradYear">Graduation Year</label>
                                    <input type="text" id="gradYear" placeholder="e.g., 2026" value={gradYear} onChange={e => setGradYear(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-gray-700 mb-1 text-sm font-medium" htmlFor="prefLocation">Preferred Location</label>
                                    <select id="prefLocation" value={prefLocation} onChange={e => setPrefLocation(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                                        <option>Remote</option>
                                        <option>New York, NY</option>
                                        <option>San Francisco, CA</option>
                                        <option>Austin, TX</option>
                                        <option>Seattle, WA</option>
                                        <option>Any</option>
                                    </select>
                                </div>
                            </div>
                             <div>
                                <label className="block text-gray-700 mb-1 text-sm font-medium" htmlFor="prefDomains">Preferred Domains (comma-separated)</label>
                                <input type="text" id="prefDomains" placeholder="e.g., Web Development, Machine Learning" value={prefDomains} onChange={e => setPrefDomains(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                             </div>
                        </>
                    )}
                    
                    {error && <p className="text-red-500 text-sm text-center !mt-4">{error}</p>}
                    <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition !mt-6">
                        {buttonText}
                    </button>
                </form>
            </div>
        </div>
    );
};


// --- MAIN APP COMPONENT ---
export default function App() {
  const [userPrompt, setUserPrompt] = useState('');
  const [recommendedInternships, setRecommendedInternships] = useState<InternshipWithReason[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<'login' | 'signup' | null>(null);
  const [savedInternshipIds, setSavedInternshipIds] = useState<Set<number>>(new Set());
  const [view, setView] = useState<'home' | 'saved' | 'feed' | 'alumni'>('home');

  const [feedInternships, setFeedInternships] = useState<InternshipWithReason[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);

  useEffect(() => {
    const loggedInUserEmail = localStorage.getItem('internai_session');
    if (loggedInUserEmail) {
        const users = JSON.parse(localStorage.getItem('internai_users') || '{}');
        const userData = users[loggedInUserEmail];
        if (userData) {
            setCurrentUser(userData);
            setSavedInternshipIds(new Set(userData.savedInternshipIds));
        }
    }
  }, []);

  const handleAuthSuccess = (user: { email: string }) => {
    const users = JSON.parse(localStorage.getItem('internai_users') || '{}');
    const userData = users[user.email];
    setCurrentUser(userData);
    setSavedInternshipIds(new Set(userData.savedInternshipIds));
    localStorage.setItem('internai_session', user.email);
    setShowAuthModal(null);
    setView('feed'); // Direct new users/logins to their feed
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSavedInternshipIds(new Set());
    localStorage.removeItem('internai_session');
    setView('home');
  };
  
  const handleSaveToggle = (internshipId: number) => {
    if (!currentUser) {
        setShowAuthModal('login');
        return;
    }
    const newSavedIds = new Set(savedInternshipIds);
    if (newSavedIds.has(internshipId)) {
        newSavedIds.delete(internshipId);
    } else {
        newSavedIds.add(internshipId);
    }
    setSavedInternshipIds(newSavedIds);

    const users = JSON.parse(localStorage.getItem('internai_users') || '{}');
    if (users[currentUser.email]) {
        users[currentUser.email].savedInternshipIds = Array.from(newSavedIds);
        localStorage.setItem('internai_users', JSON.stringify(users));
    }
  };
  
  const initialInternships = INTERNSHIPS_DATA.slice(0, 3).map(internship => ({
    ...internship,
    reason: 'A top featured opportunity for aspiring tech professionals.'
  }));

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userPrompt.trim()) {
      setError("Please tell us what you're looking for in an internship.");
      return;
    }
    setSubmitted(true);
    setLoading(true);
    setError(null);
    setRecommendedInternships([]);
    setView('home');

    try {
      const fullPrompt = `You are an expert career advisor for college students. Your task is to recommend the most suitable internships from the provided list based on the user's profile and interests.

      Here is the list of available internships in JSON format:
      ${JSON.stringify(INTERNSHIPS_DATA, null, 2)}

      Now, consider the following user request:
      "${userPrompt}"

      Based on the user's request, please return a JSON array of the top 3-5 most relevant internships. For each recommendation, provide the internship "id" and a concise "reason" (1-2 sentences) explaining why it's a great match for the user.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: fullPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.NUMBER },
                reason: { type: Type.STRING },
              },
              required: ['id', 'reason'],
            },
          },
        },
      });
      
      const recommendations: { id: number; reason: string }[] = JSON.parse(response.text);
      
      const internshipsWithReasons = recommendations.map(rec => {
        const internship = INTERNSHIPS_DATA.find(i => i.id === rec.id);
        return internship ? { ...internship, reason: rec.reason } : null;
      }).filter((i): i is InternshipWithReason => i !== null);

      setRecommendedInternships(internshipsWithReasons);

    } catch (err) {
      console.error("API Error:", err);
      setError("Sorry, we couldn't get your AI recommendations. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const getFeedRecommendations = useCallback(async () => {
    if (!currentUser) return;
    
    setFeedLoading(true);
    setFeedError(null);

    const hasSavedInternships = savedInternshipIds.size > 0;

    try {
        let fullPrompt: string;
        
        if (hasSavedInternships) {
            const savedInternshipsDetails = INTERNSHIPS_DATA.filter(i => savedInternshipIds.has(i.id));
            fullPrompt = `You are an expert career advisor acting as a recommendation engine. Based on the internships a user has already saved, recommend other relevant internships from a master list.

            Master list of ALL available internships: ${JSON.stringify(INTERNSHIPS_DATA, null, 2)}
            User's SAVED internships (indicating their preferences): ${JSON.stringify(savedInternshipsDetails, null, 2)}

            Analyze their likely interests from their saved list. Then, from the master list, recommend 3-5 NEW internships they haven't saved yet but would likely be interested in.
            Return a JSON array of these new recommendations. Provide the "id" and a concise "reason" explaining why it matches their saved preferences. Do NOT include internships the user has already saved.`;
        } else {
            // New user: recommend based on profile
            fullPrompt = `You are an expert career advisor. A new user just signed up. Based on their profile, recommend the top 3-5 most suitable internships from the master list.

            Master list of ALL available internships: ${JSON.stringify(INTERNSHIPS_DATA, null, 2)}
            
            User's Profile:
            - College: ${currentUser.college}
            - Major: ${currentUser.major}
            - Graduation Year: ${currentUser.gradYear}
            - Preferred Domains: ${currentUser.preferences.domains.join(', ')}
            - Preferred Location: ${currentUser.preferences.location}

            Return a JSON array of your top recommendations. For each, provide the "id" and a concise "reason" explaining why it's a great fit for their profile.`;
        }
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: { id: { type: Type.NUMBER }, reason: { type: Type.STRING } },
                        required: ['id', 'reason'],
                    },
                },
            },
        });

        const recommendations: { id: number; reason: string }[] = JSON.parse(response.text);
        const internshipsWithReasons = recommendations.map(rec => {
            const internship = INTERNSHIPS_DATA.find(i => i.id === rec.id);
            return internship ? { ...internship, reason: rec.reason } : null;
        }).filter((i): i is InternshipWithReason => i !== null);
        
        setFeedInternships(internshipsWithReasons);

    } catch (err) {
        console.error("Feed API Error:", err);
        setFeedError("Could not generate your personalized feed. Please try again later.");
    } finally {
        setFeedLoading(false);
    }
  }, [savedInternshipIds, currentUser]);


  useEffect(() => {
    if (view === 'feed' && currentUser) {
        getFeedRecommendations();
    }
  }, [view, currentUser, getFeedRecommendations]);


  const internshipsToDisplay = submitted ? recommendedInternships : initialInternships;
  const savedInternshipsToDisplay = INTERNSHIPS_DATA
    .filter(i => savedInternshipIds.has(i.id))
    .map(internship => ({ ...internship, reason: 'You saved this internship as a top choice.' }));
    
  const alumniInternshipsToDisplay = currentUser?.college 
    ? INTERNSHIPS_DATA
        .filter(i => i.alumniFrom?.includes(currentUser.college))
        .map(internship => ({...internship, reason: `This company is known to hire from ${currentUser.college}.`}))
    : [];

  return (
    <div className="bg-slate-50 min-h-screen font-sans">
        {showAuthModal && <AuthModal mode={showAuthModal} onClose={() => setShowAuthModal(null)} onAuthSuccess={handleAuthSuccess} />}
        
        <header className="bg-white shadow-sm sticky top-0 z-20">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                 <div className="text-2xl font-bold text-gray-800 cursor-pointer" onClick={() => setView(currentUser ? 'feed' : 'home')}>
                    Intern<span className="text-indigo-600">AI</span>
                </div>
                <nav className="flex items-center space-x-2 md:space-x-4">
                    {currentUser ? (
                        <>
                            <button onClick={() => setView('home')} className={`px-2 py-1 text-gray-600 hover:text-indigo-600 font-medium rounded-md ${view === 'home' ? 'text-indigo-600 bg-indigo-50' : ''}`}>Search</button>
                            <button onClick={() => setView('feed')} className={`px-2 py-1 text-gray-600 hover:text-indigo-600 font-medium rounded-md ${view === 'feed' ? 'text-indigo-600 bg-indigo-50' : ''}`}>For You</button>
                            <button onClick={() => setView('alumni')} className={`px-2 py-1 text-gray-600 hover:text-indigo-600 font-medium rounded-md ${view === 'alumni' ? 'text-indigo-600 bg-indigo-50' : ''}`}>Alumni Network</button>
                            <button onClick={() => setView('saved')} className={`px-2 py-1 text-gray-600 hover:text-indigo-600 font-medium rounded-md ${view === 'saved' ? 'text-indigo-600 bg-indigo-50' : ''}`}>Saved</button>
                            <span className="text-gray-300 hidden md:inline">|</span>
                            <span className="text-gray-700 hidden sm:inline text-sm truncate max-w-[100px]">{currentUser.email}</span>
                            <button onClick={handleLogout} className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 text-sm font-bold py-2 px-3 rounded-md transition">Logout</button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setShowAuthModal('login')} className="text-gray-600 hover:text-indigo-600 font-medium">Login</button>
                            <button onClick={() => setShowAuthModal('signup')} className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-700 transition">Sign Up</button>
                        </>
                    )}
                </nav>
            </div>
        </header>

      <main className="container mx-auto px-4 py-8 md:py-12">
        {view === 'home' && (
        <>
            <section className="text-center mb-10">
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800">Find Your Perfect Internship</h1>
              <p className="mt-3 text-lg text-gray-500 max-w-2xl mx-auto">Describe your skills and interests, and let our AI find the best matches for you.</p>
            </section>
            <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg mb-12 max-w-3xl mx-auto">
              <form onSubmit={handleSearchSubmit}>
                <div>
                  <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">Describe your ideal internship</label>
                  <textarea id="prompt" rows={3} value={userPrompt} onChange={(e) => setUserPrompt(e.target.value)} placeholder="e.g., I'm a computer science student with experience in React and Node.js, looking for a remote role in web development..." className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition" aria-describedby="prompt-help"/>
                  <p id="prompt-help" className="text-xs text-gray-500 mt-1">Be descriptive! Mention your skills, interests, year of study, and what you want to learn.</p>
                </div>
                <button type="submit" disabled={loading} className="w-full mt-4 bg-indigo-600 text-white font-bold py-3 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center justify-center transition disabled:bg-indigo-300 disabled:cursor-not-allowed">
                  {loading ? ( <> <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Asking the AI...</> ) : ( <> <SearchIcon className="h-5 w-5 mr-2" /> Find My Internship </> )}
                </button>
                {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
              </form>
            </div>
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">{submitted && !loading ? 'Your AI-Powered Recommendations' : 'Featured Opportunities'}</h2>
              {loading && <div className="text-center py-16"><p className="text-lg text-indigo-600">Generating personalized recommendations...</p></div>}
              {!loading && internshipsToDisplay.length > 0 && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">{internshipsToDisplay.map(internship => (<InternshipCard key={internship.id} internship={internship} isSaved={savedInternshipIds.has(internship.id)} onSave={handleSaveToggle} />))}</div>}
              {!loading && submitted && internshipsToDisplay.length === 0 && <div className="text-center py-16 bg-white rounded-lg shadow-md"><h3 className="text-xl font-semibold text-gray-700">No Matches Found</h3><p className="text-gray-500 mt-2">Try adjusting your prompt to find more opportunities.</p></div>}
            </section>
        </>
        )}
        
        {view === 'feed' && (
             <section>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">For You</h2>
                <p className="text-gray-600 mb-8">AI-powered recommendations based on your profile and saved internships.</p>
                 {feedLoading && (<div className="text-center py-16"><p className="text-lg text-indigo-600">Building your personalized feed...</p></div>)}
                {!feedLoading && feedError && (<div className="text-center py-16 bg-white rounded-lg shadow-md"><h3 className="text-xl font-semibold text-red-700">Error</h3><p className="text-gray-500 mt-2">{feedError}</p></div>)}
                {!feedLoading && !feedError && feedInternships.length > 0 && (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">{feedInternships.map(internship => (<InternshipCard key={internship.id} internship={internship} isSaved={savedInternshipIds.has(internship.id)} onSave={handleSaveToggle} />))}</div>)}
                {!feedLoading && !feedError && feedInternships.length === 0 && (
                    <div className="text-center py-16 bg-white rounded-lg shadow-md">
                       <SparklesIcon className="h-12 w-12 mx-auto text-indigo-400" />
                       <h3 className="text-xl font-semibold text-gray-700 mt-4">All Caught Up!</h3>
                       <p className="text-gray-500 mt-2">We don't have any new recommendations for you right now. Try saving more internships or check back later!</p>
                   </div>
               )}
             </section>
        )}

        {view === 'alumni' && (
            <section>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Alumni Network</h2>
                <p className="text-gray-600 mb-8">Opportunities from companies that hire from {currentUser?.college || 'your college'}.</p>
                {alumniInternshipsToDisplay.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {alumniInternshipsToDisplay.map(internship => (
                            <InternshipCard key={internship.id} internship={internship} isSaved={savedInternshipIds.has(internship.id)} onSave={handleSaveToggle} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white rounded-lg shadow-md">
                        <UsersIcon className="h-12 w-12 mx-auto text-indigo-400" />
                        <h3 className="text-xl font-semibold text-gray-700 mt-4">No Alumni Opportunities Found</h3>
                        <p className="text-gray-500 mt-2">We couldn't find any internships from your school's network at the moment. Make sure your college is set correctly in your profile!</p>
                    </div>
                )}
            </section>
        )}

        {view === 'saved' && (
            <section>
                <h2 className="text-3xl font-bold text-gray-800 mb-8">Your Saved Internships</h2>
                {savedInternshipsToDisplay.length > 0 ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {savedInternshipsToDisplay.map(internship => (
                            <InternshipCard key={internship.id} internship={internship} isSaved={savedInternshipIds.has(internship.id)} onSave={handleSaveToggle} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold text-gray-700">No Saved Internships</h3>
                        <p className="text-gray-500 mt-2">Click the bookmark icon on any internship to save it here.</p>
                    </div>
                )}
            </section>
        )}
      </main>
    </div>
  );
}
