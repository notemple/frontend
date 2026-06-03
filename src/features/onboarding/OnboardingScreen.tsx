import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkle, Eye, CalendarBlank, CheckSquare, Tag, CaretRight, 
  ArrowRight, ArrowLeft, GoogleLogo, GithubLogo, Envelope, Check, CircleNotch, List,
  Terminal, GraduationCap, Palette, Microscope, RocketLaunch, User
} from '@phosphor-icons/react';
import { useSettingsStore } from '@/features/settings/store';
import { useUiStore } from '@/shared/store/uiStore';
import { useDocumentStore } from '@/features/documents/store';
import { useTaskStore } from '@/features/tasks/store';
import { documentService } from '@/services/document.service';
import { taskService } from '@/services/task.service';
import { cn } from '@/shared/lib/utils';

const STYLE_PRESETS = [
  { id: 'Developer', title: 'Developer', description: 'Build projects, write documentation, and capture code snippets.', icon: <Terminal size={22} className="text-[#CDB4DB]" /> },
  { id: 'Student', title: 'Student', description: 'Track assignments, organize class lectures, and manage study guides.', icon: <GraduationCap size={22} className="text-[#CDB4DB]" /> },
  { id: 'Creator', title: 'Creator', description: 'Draft scripts, outline content ideas, and structure creative assets.', icon: <Palette size={22} className="text-[#CDB4DB]" /> },
  { id: 'Researcher', title: 'Researcher', description: 'Compile references, document experiments, and analyze findings.', icon: <Microscope size={22} className="text-[#CDB4DB]" /> },
  { id: 'Startup', title: 'Startup', description: 'Organize team syncs, write product requirements, and track roadmap.', icon: <RocketLaunch size={22} className="text-[#CDB4DB]" /> },
  { id: 'Personal', title: 'Personal', description: 'Journal daily thoughts, set life goals, and coordinate daily tasks.', icon: <User size={22} className="text-[#CDB4DB]" /> }
];

export const OnboardingScreen = () => {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [workspaceName, setWorkspaceName] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<'Developer' | 'Student' | 'Creator' | 'Researcher' | 'Startup' | 'Personal'>('Personal');
  const [creationProgress, setCreationProgress] = useState(0);
  const [creationComplete, setCreationComplete] = useState(false);
  
  // Tutorial State
  const [tutorialIndex, setTutorialIndex] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);

  const { setIsOnboardingCompleted } = useSettingsStore();

  const nameInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when entering Step 2
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 300);
    }
  }, [step]);

  // Handle Spotlight coordinates updating dynamically
  useEffect(() => {
    if (step !== 5) {
      setSpotlightRect(null);
      return;
    }

    const updateSpotlight = () => {
      if (tutorialIndex === 0) {
        useUiStore.getState().openDocument('section-glance');
        setTimeout(() => {
          const el = document.getElementById('onboarding-quick-capture');
          if (el) setSpotlightRect(el.getBoundingClientRect());
        }, 100);
      } else if (tutorialIndex === 1) {
        useUiStore.getState().openDocument('welcome-doc');
        setTimeout(() => {
          const el = document.getElementById('onboarding-editor');
          if (el) setSpotlightRect(el.getBoundingClientRect());
        }, 100);
      } else if (tutorialIndex === 2) {
        useUiStore.setState({ isSidebarOpen: true });
        setTimeout(() => {
          const el = document.getElementById('onboarding-ask-ai');
          if (el) setSpotlightRect(el.getBoundingClientRect());
        }, 100);
      }
    };

    updateSpotlight();
    window.addEventListener('resize', updateSpotlight);
    
    const interval = setInterval(updateSpotlight, 350);

    return () => {
      window.removeEventListener('resize', updateSpotlight);
      clearInterval(interval);
    };
  }, [step, tutorialIndex]);

  // Step 4 Workspace Setup process (No emojis in titles)
  useEffect(() => {
    if (step !== 4) return;

    let progressInterval: any;
    
    const runSetup = async () => {
      let currentProgress = 0;
      progressInterval = setInterval(() => {
        currentProgress += 3;
        if (currentProgress >= 90) {
          clearInterval(progressInterval);
        } else {
          setCreationProgress(currentProgress);
        }
      }, 50);

      try {
        useSettingsStore.getState().setSpaceName(workspaceName.trim() || 'My Workspace');

        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const dailyNoteId = `daily-note-${yyyy}-${mm}-${dd}`;

        const createdFolders: { id: string; name: string }[] = [];
        const createdDocs: any[] = [];
        const createdTasks: any[] = [];

        if (selectedStyle === 'Developer') {
          createdFolders.push(
            { id: 'folder-dev-projects', name: 'Projects' },
            { id: 'folder-dev-docs', name: 'Documentation' },
            { id: 'folder-dev-snippets', name: 'Snippets' }
          );
          createdDocs.push(
            {
              id: 'welcome-doc',
              title: 'Welcome to Glance',
              folderId: null,
              tags: ['guide', 'dev'],
              content: `<h1>Welcome to your Developer Workspace</h1><p>Glance is your calm, intelligent workspace for ideas, tasks, and code snippet references.</p><h3>Pro Tips:</h3><ul><li>Type <strong>/</strong> in this editor to insert tables, quotes, toggles, or code blocks.</li><li>Type <strong>@</strong> to link to other documents, tasks, or tags.</li><li>Press <strong>Tab</strong> to activate AI autocomplete on any paragraph.</li></ul>`
            },
            {
              id: 'doc-dev-roadmap',
              title: 'Project Roadmap',
              folderId: 'folder-dev-projects',
              tags: ['projects'],
              content: `<h1>Project Roadmap</h1><p>A high-level review of active software projects and features.</p><h3>Sprint Targets</h3><ul><li>[ ] Integrate IndexDB storage synchronization</li><li>[ ] Polish UI onboarding page transitions</li><li>[ ] Optimize largest contentful paint (LCP)</li></ul>`
            },
            {
              id: 'doc-dev-setup',
              title: 'Local Setup Guide',
              folderId: 'folder-dev-docs',
              tags: ['dev'],
              content: `<h1>Setup Guide</h1><p>Follow these quick commands to spin up the local development environment:</p><pre><code># Install packages\nbun install\n\n# Spin up dev server\nbun run dev</code></pre>`
            },
            {
              id: dailyNoteId,
              title: '', 
              folderId: null,
              tags: ['daily-notes'],
              content: `<h1>Daily Standup — ${yyyy}-${mm}-${dd}</h1><h3>Yesterday's progress:</h3><ul><li>Implemented premium onboarding screen overlays</li></ul><h3>Today's focus:</h3><ul><li>Add automated unit test suites</li></ul><h3>Blockers:</h3><p>None.</p>`
            }
          );
          createdTasks.push(
            { title: 'Setup local development configurations', list: 'Today', completed: false, priority: 'urgent' },
            { title: 'Refactor state store selectors', list: 'Upcoming', completed: false, priority: 'medium' },
            { title: 'Write unit tests for storage schemas', list: 'All Tasks', completed: false, priority: 'low' }
          );
        } else if (selectedStyle === 'Student') {
          createdFolders.push(
            { id: 'folder-stud-classes', name: 'Classes' },
            { id: 'folder-stud-assign', name: 'Assignments' },
            { id: 'folder-stud-guides', name: 'Study Guides' }
          );
          createdDocs.push(
            {
              id: 'welcome-doc',
              title: 'Welcome to Glance',
              folderId: null,
              tags: ['guide', 'school'],
              content: `<h1>Welcome to your Student Workspace</h1><p>Glance helps you keep track of classes, notes, and deadlines without clutter. Here is your initial setup:</p><ul><li>Use folders to group notes by subject.</li><li>Create daily notes to structure your study sessions.</li></ul>`
            },
            {
              id: 'doc-stud-overview',
              title: 'Semester Overview',
              folderId: 'folder-stud-classes',
              tags: ['school'],
              content: `<h1>Semester Overview</h1><p>Class times, professor contacts, and active syllabus trackers.</p><h3>Schedule</h3><ul><li><strong>CS 101:</strong> Mon/Wed 10:00 AM (Hall A)</li><li><strong>MATH 202:</strong> Tue/Thu 11:30 AM (Science Hall)</li></ul>`
            },
            {
              id: 'doc-stud-prep',
              title: 'Exam Preparation',
              folderId: 'folder-stud-guides',
              tags: ['exams'],
              content: `<h1>Exam Prep Checklist</h1><p>Study guides and self-assessment items.</p><ul><li>[ ] CS 101: Review sorting algorithms</li><li>[ ] Math 202: Solve practice problem set 4</li></ul>`
            },
            {
              id: dailyNoteId,
              title: '',
              folderId: null,
              tags: ['daily-notes'],
              content: `<h1>Daily Study Log — ${yyyy}-${mm}-${dd}</h1><h3>Today's lectures:</h3><ul><li>CS 101 - Lecture 4</li></ul><h3>Tasks to finish:</h3><ul><li>Math assignment 2 submissions</li></ul>`
            }
          );
          createdTasks.push(
            { title: 'Read Chapter 4 of Math Textbook', list: 'Today', completed: false, priority: 'medium' },
            { title: 'Submit CS 101 Sorting Assignment', list: 'Upcoming', completed: false, priority: 'urgent' },
            { title: 'Email professor about research project topic', list: 'All Tasks', completed: false, priority: 'low' }
          );
        } else if (selectedStyle === 'Creator') {
          createdFolders.push(
            { id: 'folder-creat-ideas', name: 'Ideas & Drafts' },
            { id: 'folder-creat-calendar', name: 'Content Calendar' },
            { id: 'folder-creat-assets', name: 'Assets' }
          );
          createdDocs.push(
            {
              id: 'welcome-doc',
              title: 'Welcome to Glance',
              folderId: null,
              tags: ['guide', 'creative'],
              content: `<h1>Welcome to your Creator Workspace</h1><p>Brainstorm video concepts, draft scripts, and track your publications easily.</p>`
            },
            {
              id: 'doc-creat-calendar',
              title: 'Content Calendar',
              folderId: 'folder-creat-calendar',
              tags: ['planning'],
              content: `<h1>Content Calendar</h1><p>Track uploads, sponsors, and channels.</p><ul><li><strong>June 15:</strong> Tech setup review</li><li><strong>June 22:</strong> 10 habits for deep focus</li></ul>`
            },
            {
              id: 'doc-creat-script',
              title: 'Video Script: Desk Setup',
              folderId: 'folder-creat-ideas',
              tags: ['scripts'],
              content: `<h1>Video Script: Minimal Desk Setup</h1><h3>Hook Intro</h3><p>Show visual b-roll of a clean desk in warm lighting. Fade in audio.</p><blockquote>"A focused workspace leads directly to a focused mind."</blockquote>`
            },
            {
              id: dailyNoteId,
              title: '',
              folderId: null,
              tags: ['daily-notes'],
              content: `<h1>Creative Session Log — ${yyyy}-${mm}-${dd}</h1><h3>Creative ideas today:</h3><ul><li>Comparison video on productivity tools</li></ul><h3>Task list:</h3><ul><li>Shoot visual b-roll for setup video</li></ul>`
            }
          );
          createdTasks.push(
            { title: 'Record b-roll clips of workspace', list: 'Today', completed: false, priority: 'medium' },
            { title: 'Draft script for productivity review', list: 'Upcoming', completed: false, priority: 'urgent' },
            { title: 'Reach out to sponsor contacts', list: 'All Tasks', completed: false, priority: 'low' }
          );
        } else if (selectedStyle === 'Researcher') {
          createdFolders.push(
            { id: 'folder-res-lit', name: 'Literature Review' },
            { id: 'folder-res-exp', name: 'Experiments' },
            { id: 'folder-res-ref', name: 'References' }
          );
          createdDocs.push(
            {
              id: 'welcome-doc',
              title: 'Welcome to Glance',
              folderId: null,
              tags: ['guide', 'research'],
              content: `<h1>Welcome to your Research Workspace</h1><p>Record lab findings, link academic references, and write thesis drafts.</p>`
            },
            {
              id: 'doc-res-thesis',
              title: 'Thesis Outline',
              folderId: 'folder-res-lit',
              tags: ['thesis'],
              content: `<h1>Thesis Outline</h1><p>Subject: Conflict-free Replicated Data Types (CRDTs) in local-first apps.</p><h3>Key Hypotheses</h3><ul><li>Local storage minimizes network sync latencies.</li><li>Peer network topologies reduce infrastructure costs.</li></ul>`
            },
            {
              id: 'doc-res-log',
              title: 'Experiment Logs',
              folderId: 'folder-res-exp',
              tags: ['experiments'],
              content: `<h1>Experiment Logbook</h1><p>Testing replication latency metrics across varying network speeds.</p><ul><li><strong>Test Run 1:</strong> Success (average response 18ms)</li><li><strong>Test Run 2:</strong> 40% packet drops simulated</li></ul>`
            },
            {
              id: dailyNoteId,
              title: '',
              folderId: null,
              tags: ['daily-notes'],
              content: `<h1>Research Notes — ${yyyy}-${mm}-${dd}</h1><h3>Discoveries & Hypotheses:</h3><p>State sync runs 20% faster when indexes are local.</p><h3>Paper reading list:</h3><ul><li>Read Kleppmann (2018) paper</li></ul>`
            }
          );
          createdTasks.push(
            { title: 'Read academic CRDT papers', list: 'Today', completed: false, priority: 'medium' },
            { title: 'Plot benchmark performance figures', list: 'Upcoming', completed: false, priority: 'urgent' },
            { title: 'Format thesis bibliography entries', list: 'All Tasks', completed: false, priority: 'low' }
          );
        } else if (selectedStyle === 'Startup') {
          createdFolders.push(
            { id: 'folder-start-strategy', name: 'Pitch & Strategy' },
            { id: 'folder-start-team', name: 'Team Updates' },
            { id: 'folder-start-product', name: 'Product Specs' }
          );
          createdDocs.push(
            {
              id: 'welcome-doc',
              title: 'Welcome to Glance',
              folderId: null,
              tags: ['guide', 'startup'],
              content: `<h1>Welcome to your Startup Workspace</h1><p>Align team targets, draft strategy documents, and manage software specifications.</p>`
            },
            {
              id: 'doc-start-onepager',
              title: 'One Pager Strategy',
              folderId: 'folder-start-strategy',
              tags: ['strategy'],
              content: `<h1>Glance Strategy One-Pager</h1><p>Building the next-generation intelligent local-first productivity workspace for writers and developer teams.</p><h3>Target Audience</h3><p>Knowledge workers, developers, and writers seeking high-focus local-first tools.</p>`
            },
            {
              id: 'doc-start-prd',
              title: 'Product Spec: Onboarding',
              folderId: 'folder-start-product',
              tags: ['prd'],
              content: `<h1>Product Specs: Onboarding Experience</h1><h3>User Experience Target</h3><p>Frictionless onboarding that guides users in less than 60 seconds.</p>`
            },
            {
              id: dailyNoteId,
              title: '',
              folderId: null,
              tags: ['daily-notes'],
              content: `<h1>Daily Sync — ${yyyy}-${mm}-${dd}</h1><h3>Active Metrics:</h3><ul><li>Daily Active Users: 1,420</li></ul><h3>Standup Agenda:</h3><ul><li>Sync with engineering team on local Dexie indexing issues</li></ul>`
            }
          );
          createdTasks.push(
            { title: 'Review startup seed pitch slides', list: 'Today', completed: false, priority: 'urgent' },
            { title: 'Draft Product Spec for workspace sharing', list: 'Upcoming', completed: false, priority: 'medium' },
            { title: 'Update investor forecast models', list: 'All Tasks', completed: false, priority: 'low' }
          );
        } else {
          // Personal Default
          createdFolders.push(
            { id: 'folder-pers-journal', name: 'Journal' },
            { id: 'folder-pers-goals', name: 'Goals' },
            { id: 'folder-pers-admin', name: 'Life Admin' }
          );
          createdDocs.push(
            {
              id: 'welcome-doc',
              title: 'Welcome to Glance',
              folderId: null,
              tags: ['guide', 'personal'],
              content: `<h1>Welcome to Glance</h1><p>This is your personal workspace for daily journals, goal-tracking, and managing tasks.</p>`
            },
            {
              id: 'doc-pers-goals',
              title: 'Yearly Goals',
              folderId: 'folder-pers-goals',
              tags: ['goals'],
              content: `<h1>Yearly Goals</h1><p>Intentions set for health, reading, and digital skills.</p><h3>Pillars</h3><ul><li>🏃‍♂️ Practice mindfulness, run a 5km race</li><li>📚 Read 12 non-fiction books</li><li>🛠️ Build side-projects in open source</li></ul>`
            },
            {
              id: 'doc-pers-reading',
              title: 'Reading List',
              folderId: 'folder-pers-admin',
              tags: ['books'],
              content: `<h1>Reading List</h1><p>Books to explore this year.</p><ul><li>[x] Atomic Habits by James Clear</li><li>[ ] Designing Data-Intensive Applications by Martin Kleppmann</li></ul>`
            },
            {
              id: dailyNoteId,
              title: '',
              folderId: null,
              tags: ['daily-notes'],
              content: `<h1>Daily Journal — ${yyyy}-${mm}-${dd}</h1><h3>Gratitude list:</h3><ol><li>A quiet morning for focus</li><li>Good coffee</li><li>Getting this new workspace started</li></ol><h3>Focus of the day:</h3><p>Design a calm daily routine.</p>`
            }
          );
          createdTasks.push(
            { title: 'Schedule medical checkup call', list: 'Today', completed: false, priority: 'medium' },
            { title: 'Write down weekly meal plan', list: 'Upcoming', completed: false, priority: 'low' },
            { title: 'Practice 15 minutes of meditation', list: 'All Tasks', completed: false, priority: 'urgent' }
          );
        }

        for (const folder of createdFolders) {
          await documentService.saveFolder(folder);
        }
        
        const folderIds = createdFolders.map(f => f.id);
        const docIds = createdDocs.map(d => d.id);
        await documentService.setMetadata("folderOrder", folderIds);
        await documentService.setMetadata("documentOrder", docIds);

        for (const doc of createdDocs) {
          await documentService.saveDocument({
            id: doc.id,
            title: doc.title,
            content: doc.content,
            tags: doc.tags,
            folderId: doc.folderId,
            type: doc.id.startsWith('daily-note-') ? 'daily-note' : 'page',
            updatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            author: 'You'
          });
        }

        for (const task of createdTasks) {
          await taskService.saveTask({
            id: `task-${crypto.randomUUID()}`,
            title: task.title,
            list: task.list,
            completed: task.completed,
            status: task.completed ? 'done' : 'open',
            priority: task.priority,
            createdAt: new Date().toISOString()
          });
        }

        await taskService.saveTask({
          id: 'task-onboarding-capture',
          title: 'Try quick capture below to write a note',
          list: 'Today',
          completed: false,
          status: 'open',
          priority: 'medium',
          createdAt: new Date().toISOString()
        });

        await taskService.saveTask({
          id: 'task-onboarding-slash',
          title: 'Press / in the editor to see formatting options',
          list: 'Upcoming',
          completed: false,
          status: 'open',
          priority: 'medium',
          createdAt: new Date().toISOString()
        });

        const finalDocs = await documentService.listDocuments();
        const finalFolders = await documentService.listFolders();
        useDocumentStore.setState({
          documents: finalDocs.reduce((acc, d) => ({ ...acc, [d.id]: d }), {}),
          folders: finalFolders,
          documentOrder: finalDocs.map(d => d.id),
          folderOrder: finalFolders.map(f => f.id),
          isInitialized: true
        });

        const finalTasks = await taskService.listTasks();
        useTaskStore.setState({
          tasks: finalTasks,
          isInitialized: true
        });

        clearInterval(progressInterval);
        setCreationProgress(100);
        setTimeout(() => {
          setCreationComplete(true);
          setTimeout(() => {
            setStep(5);
          }, 800);
        }, 300);

      } catch (err) {
        console.error("Workspace setup failed:", err);
        clearInterval(progressInterval);
      }
    };

    runSetup();

    return () => {
      clearInterval(progressInterval);
    };
  }, [step]);

  const nextStep = () => {
    if (step === 1) setStep(2);
    else if (step === 2) setStep(3);
    else if (step === 3) setStep(4);
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else if (step === 3) {
      setStep(2);
    } else if (step === 5) {
      if (tutorialIndex > 0) {
        setTutorialIndex(tutorialIndex - 1);
      } else {
        setCreationComplete(false);
        setCreationProgress(0);
        setStep(3);
      }
    } else if (step === 6) {
      setStep(5);
      setTutorialIndex(2);
    }
  };

  const handleFinishOnboarding = () => {
    setIsOnboardingCompleted(true);
  };

  const skipTutorial = () => {
    setStep(6);
  };

  const nextTutorial = () => {
    if (tutorialIndex < 2) {
      setTutorialIndex(tutorialIndex + 1);
    } else {
      setStep(6);
    }
  };

  // Onboarding split-screen layouts
  const pageContainerClass = "absolute inset-0 flex w-full h-full bg-[#050505] z-[9999] select-none text-white overflow-hidden";

  return (
    <>
      {/* Inline styles for custom hardware-accelerated floating animation of the background */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes floatGraffiti {
          0% { transform: scale(1.15) translateY(-30px); }
          50% { transform: scale(1.15) translateY(30px); }
          100% { transform: scale(1.15) translateY(-30px); }
        }
        .graffiti-backdrop {
          position: absolute;
          inset: 0;
          background-image: url('/graffiti_bg.png');
          background-size: cover;
          background-position: center;
          filter: brightness(0.24) contrast(1.1) saturate(0.85);
          animation: floatGraffiti 30s ease-in-out infinite;
          z-index: 1;
        }
        .graffiti-ambient-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(5, 5, 5, 0.45) 0%, rgba(5, 5, 5, 0.85) 100%);
          z-index: 2;
          pointer-events: none;
        }
      `}} />

      <AnimatePresence mode="wait">
        {step < 5 && (
          <motion.div
            key="pre-tutorial-screens"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.4 } }}
            className={pageContainerClass}
          >
            {/* LEFT SIDE (60%): Forms for Welcome, Name and Style */}
            <div className="w-full md:w-[60%] h-full bg-[#050505] flex flex-col items-center justify-center p-8 md:p-16 relative z-10">
              
              {/* Step 1: Welcome / Sign-in */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full max-w-xs flex flex-col space-y-3"
                >
                  <button 
                    onClick={nextStep}
                    className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-zinc-950/70 hover:bg-[#CDB4DB]/10 border border-[#CDB4DB]/20 hover:border-[#CDB4DB]/45 rounded-lg text-sm text-[#CDB4DB] hover:text-white transition-all duration-200 cursor-pointer active:scale-[0.99] font-medium"
                  >
                    <GoogleLogo size={18} className="text-[#CDB4DB]/80" />
                    Continue with Google
                  </button>

                  <button 
                    onClick={nextStep}
                    className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-zinc-950/70 hover:bg-[#CDB4DB]/10 border border-[#CDB4DB]/20 hover:border-[#CDB4DB]/45 rounded-lg text-sm text-[#CDB4DB] hover:text-white transition-all duration-200 cursor-pointer active:scale-[0.99] font-medium"
                  >
                    <GithubLogo size={18} className="text-[#CDB4DB]/80" />
                    Continue with GitHub
                  </button>

                  <button 
                    onClick={nextStep}
                    className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-zinc-950/70 hover:bg-[#CDB4DB]/10 border border-[#CDB4DB]/20 hover:border-[#CDB4DB]/45 rounded-lg text-sm text-[#CDB4DB] hover:text-white transition-all duration-200 cursor-pointer active:scale-[0.99] font-medium"
                  >
                    <Envelope size={18} className="text-[#CDB4DB]/80" />
                    Continue with Email
                  </button>
                </motion.div>
              )}

              {/* Step 2: Workspace Name */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full max-w-sm flex flex-col items-center space-y-8 text-center"
                >
                  <div className="space-y-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#CDB4DB]">Step 2 of 3</span>
                    <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 font-sans">
                      What should we call your workspace?
                    </h1>
                  </div>

                  <div className="w-full relative max-w-sm pt-4">
                    <input
                      ref={nameInputRef}
                      type="text"
                      value={workspaceName}
                      onChange={(e) => setWorkspaceName(e.target.value)}
                      placeholder="e.g. Personal Space, Startup Lab"
                      className="w-full bg-transparent border-b border-[#CDB4DB]/30 focus:border-[#CDB4DB] outline-none text-lg text-center pb-2 text-zinc-100 placeholder-zinc-700 transition-colors"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && workspaceName.trim()) {
                          nextStep();
                        }
                      }}
                    />
                    
                    {workspaceName.trim() && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center text-[10px] text-[#CDB4DB]/70 font-mono"
                      >
                        press Enter ↵
                      </motion.div>
                    )}
                  </div>

                  <button
                    disabled={!workspaceName.trim()}
                    onClick={nextStep}
                    className="px-6 py-2 bg-[#CDB4DB] hover:bg-[#b8a0c5] disabled:opacity-40 disabled:pointer-events-none text-zinc-950 text-sm font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    Continue
                    <ArrowRight size={14} weight="bold" />
                  </button>
                </motion.div>
              )}

              {/* Step 3: Choose Style */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full max-w-lg flex flex-col items-center space-y-6 text-center"
                >
                  <div className="space-y-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#CDB4DB]">Step 3 of 3</span>
                    <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 font-sans">
                      Choose your style
                    </h1>
                    <p className="text-xs text-zinc-400 font-sans">
                      This personalizes folders, default templates, and sample layouts.
                    </p>
                  </div>

                  {/* Cards Grid */}
                  <div className="w-full grid grid-cols-2 gap-3 pt-2">
                    {STYLE_PRESETS.map((preset) => {
                      const isSelected = selectedStyle === preset.id;
                      return (
                        <button
                          key={preset.id}
                          onClick={() => setSelectedStyle(preset.id as any)}
                          className={cn(
                            "flex flex-col items-start text-left p-4 rounded-xl border bg-zinc-950/60 hover:bg-zinc-900/30 transition-all duration-200 cursor-pointer group active:scale-[0.98]",
                            isSelected 
                              ? "border-[#CDB4DB] bg-[#CDB4DB]/[0.03]" 
                              : "border-zinc-900 hover:border-[#CDB4DB]/20"
                          )}
                        >
                          <span className="mb-3 block">{preset.icon}</span>
                          <span className={cn(
                            "text-xs font-semibold mb-1 transition-colors",
                            isSelected ? "text-[#CDB4DB]" : "text-zinc-300 group-hover:text-zinc-200"
                          )}>
                            {preset.title}
                          </span>
                          <span className="text-[10px] leading-relaxed text-zinc-500 font-sans">
                            {preset.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={nextStep}
                    className="px-6 py-2.5 bg-[#CDB4DB] hover:bg-[#b8a0c5] text-zinc-950 text-sm font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer active:scale-[0.98] shadow-sm"
                  >
                    Create Workspace
                    <ArrowRight size={14} weight="bold" />
                  </button>
                </motion.div>
              )}

              {/* Step 4: Loading / Setup State */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full max-w-sm flex flex-col items-center space-y-6 text-center"
                >
                  <div className="w-12 h-12 flex items-center justify-center rounded-full bg-zinc-950/80 border border-[#CDB4DB]/20 relative">
                    <AnimatePresence mode="wait">
                      {!creationComplete ? (
                        <motion.div
                          key="loading-spinner"
                          initial={{ opacity: 0, rotate: 0 }}
                          animate={{ opacity: 1, rotate: 360 }}
                          exit={{ opacity: 0 }}
                          transition={{ rotate: { repeat: Infinity, duration: 1.2, ease: "linear" } }}
                          className="text-[#CDB4DB]"
                        >
                          <CircleNotch size={20} className="animate-spin" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="check-icon"
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-[#CDB4DB]"
                        >
                          <Check size={20} weight="bold" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="space-y-1">
                    <span className="text-sm font-medium text-zinc-300">
                      {!creationComplete ? 'Setting up your workspace…' : 'Workspace ready'}
                    </span>
                    <p className="text-[10px] text-zinc-500 font-mono">
                      Generating templates & configuring stores...
                    </p>
                  </div>

                  <div className="w-48 h-1 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                    <motion.div
                      className="h-full bg-[#CDB4DB]"
                      initial={{ width: '0%' }}
                      animate={{ width: `${creationProgress}%` }}
                      transition={{ ease: 'easeOut' }}
                    />
                  </div>
                </motion.div>
              )}
            </div>

            {/* RIGHT SIDE (40%): Floating Graffiti Background + welcome to notemple story */}
            <div className="hidden md:flex w-[40%] h-full overflow-hidden border-l border-zinc-900 flex-col justify-between p-12 text-left bg-zinc-950 relative z-10">
              <div className="graffiti-backdrop" />
              <div className="graffiti-ambient-overlay" />
              
              <div className="relative z-10 flex flex-col h-full justify-between">
                {/* welcome to notemple Header */}
                <div>
                  <span className="text-[9px] font-semibold text-[#CDB4DB]/80 tracking-[0.25em] uppercase font-mono">
                    notemple
                  </span>
                  <h2 className="text-xl font-medium tracking-tight text-white mt-1.5 font-sans">
                    welcome to notemple
                  </h2>
                </div>

                {/* Narrative step texts */}
                <div className="my-auto space-y-4 max-w-xs">
                  <AnimatePresence mode="wait">
                    {step === 1 && (
                      <motion.div
                        key="story-1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-3"
                      >
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#CDB4DB]/95 font-mono">Welcome</h3>
                        <p className="text-xs leading-relaxed text-zinc-400 font-sans">
                          Notemple is designed to be a friction-free environment for your notes, focus, and tasks. A place to write, plan, and think without clutter.
                        </p>
                      </motion.div>
                    )}
                    {step === 2 && (
                      <motion.div
                        key="story-2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-3"
                      >
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#CDB4DB]/95 font-mono">Our Story</h3>
                        <p className="text-xs leading-relaxed text-zinc-400 font-sans">
                          Notemple was built from a simple realization: modern productivity tools have too many boxes and templates. We wanted a place that feels like a clean physical notebook, but runs on an intelligent local-first sync engine.
                        </p>
                      </motion.div>
                    )}
                    {step === 3 && (
                      <motion.div
                        key="story-3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-3"
                      >
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#CDB4DB]/95 font-mono">How It's Better</h3>
                        <p className="text-xs leading-relaxed text-zinc-400 font-sans">
                          By aligning folders, default templates, and daily notes with your selected workspace style, Notemple adapts to you from the start. No complex configurations, no empty space. Just write.
                        </p>
                      </motion.div>
                    )}
                    {step === 4 && (
                      <motion.div
                        key="story-4"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-3"
                      >
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#CDB4DB]/95 font-mono">Workspace Seeding</h3>
                        <p className="text-xs leading-relaxed text-zinc-400 font-sans">
                          We are seeding your database with folders and daily note templates tailored to your profile. This will take only a second.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Footer copyright */}
                <div className="text-[9px] text-zinc-600 font-mono tracking-wider">
                  © 2026 Notemple Inc.
                </div>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Step 5: Spotlight Tutorial */}
      {step === 5 && (
        <div className="fixed inset-0 z-[9998] pointer-events-none">
          <svg className="fixed inset-0 w-full h-full pointer-events-auto z-[9998]" style={{ transition: 'opacity 0.3s ease' }}>
            <defs>
              <mask id="spotlight-mask">
                <rect width="100%" height="100%" fill="white" />
                {spotlightRect && (
                  <rect
                    x={spotlightRect.x - 8}
                    y={spotlightRect.y - 8}
                    width={spotlightRect.width + 16}
                    height={spotlightRect.height + 16}
                    rx={8}
                    fill="black"
                    style={{ transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)' }}
                  />
                )}
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="rgba(5, 5, 5, 0.76)" mask="url(#spotlight-mask)" />
          </svg>

          {/* Spotlight borders utilizing soft pastel colors */}
          {spotlightRect && (
            <div
              className="absolute border border-[#CDB4DB]/50 rounded-lg pointer-events-none z-[9999]"
              style={{
                top: spotlightRect.y - 8,
                left: spotlightRect.x - 8,
                width: spotlightRect.width + 16,
                height: spotlightRect.height + 16,
                boxShadow: '0 0 15px rgba(205, 180, 219, 0.15)',
                transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)'
              }}
            />
          )}

          {/* Tooltip Card */}
          <div
            className="fixed w-[320px] bg-zinc-950/95 border border-[#CDB4DB]/20 rounded-xl p-5 shadow-lg pointer-events-auto z-[9999] flex flex-col space-y-4"
            style={{
              transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
              ...(spotlightRect ? {
                top: (window.innerHeight - spotlightRect.bottom > 220) ? spotlightRect.bottom + 16 : undefined,
                bottom: (window.innerHeight - spotlightRect.bottom <= 220 && spotlightRect.top > 220) ? (window.innerHeight - spotlightRect.top) + 16 : undefined,
                left: Math.max(16, Math.min(window.innerWidth - 336, spotlightRect.left + spotlightRect.width / 2 - 160)),
              } : {
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              })
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-[#CDB4DB] tracking-wider uppercase font-mono">
                Tutorial {tutorialIndex + 1} of 3
              </span>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-colors", 
                      i === tutorialIndex ? "bg-[#CDB4DB]" : "bg-zinc-800"
                    )} 
                  />
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xs font-semibold text-zinc-100">
                {tutorialIndex === 0 && "Quick Capture Box"}
                {tutorialIndex === 1 && "The Document Editor"}
                {tutorialIndex === 2 && "Mentions & AI Companion"}
              </h3>
              <p className="text-[11px] leading-relaxed text-zinc-400">
                {tutorialIndex === 0 && "Capture thoughts instantly using natural language or slash commands."}
                {tutorialIndex === 1 && "Use / commands to add tables, tasks, quotes, toggles, and more."}
                {tutorialIndex === 2 && "Use @ to reference documents, tasks, tags, and ask AI to organize your workspace."}
              </p>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                onClick={skipTutorial}
                className="text-[11px] text-zinc-500 hover:text-[#CDB4DB]/85 font-medium transition-colors cursor-pointer"
              >
                Skip Tutorial
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleBack}
                  className="px-2.5 py-1.5 bg-zinc-950 text-[#CDB4DB]/70 hover:text-white text-[11px] font-semibold rounded-md border border-[#CDB4DB]/20 hover:border-[#CDB4DB]/45 transition-all cursor-pointer active:scale-95"
                >
                  Back
                </button>
                <button
                  onClick={nextTutorial}
                  className="px-3.5 py-1.5 bg-[#CDB4DB] text-zinc-950 hover:bg-[#b8a0c5] text-[11px] font-semibold rounded-md flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  {tutorialIndex === 2 ? "Get Started" : "Next"}
                  <CaretRight size={12} weight="bold" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 6: Final Done Screen */}
      {step === 6 && (
        <motion.div
          key="step6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={pageContainerClass}
          style={{
            background: 'radial-gradient(circle at center, rgba(205, 180, 219, 0.04) 0%, #050505 85%)'
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-sm flex flex-col items-center text-center space-y-8 relative z-10"
          >
            <div className="relative w-16 h-16 flex items-center justify-center rounded-full bg-zinc-950 border border-[#CDB4DB]/30 shadow-md">
              <div className="absolute inset-0 rounded-full bg-[#CDB4DB]/5 animate-pulse" />
              <Check className="text-[#CDB4DB] relative z-10" size={24} weight="bold" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
                You’re all set.
              </h1>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto font-sans">
                Welcome to your new intelligent space. Let's start thinking together.
              </p>
            </div>

            <button
              onClick={handleFinishOnboarding}
              className="w-full max-w-xs py-2.5 px-4 bg-[#CDB4DB] hover:bg-[#b8a0c5] text-zinc-950 text-sm font-semibold rounded-lg shadow-sm hover:shadow-purple-500/10 active:scale-[0.99] transition-all cursor-pointer"
            >
              Open Workspace
            </button>
          </motion.div>
        </motion.div>
      )}

      {step > 1 && step !== 4 && step !== 5 && (
        <button
          onClick={handleBack}
          className="absolute top-8 left-8 flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-[#CDB4DB] transition-colors cursor-pointer group z-[99999] pointer-events-auto"
        >
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
          Back
        </button>
      )}
    </>
  );
};
