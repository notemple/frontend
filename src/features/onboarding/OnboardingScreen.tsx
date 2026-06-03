import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CaretRight, ArrowRight, ArrowLeft, GoogleLogo, GithubLogo, Envelope, Check, CircleNotch,
  Terminal, GraduationCap, Palette, Microscope, RocketLaunch, User,
  FileText, X
} from '@phosphor-icons/react';
import { useSettingsStore } from '@/features/settings/store';
import { useUiStore } from '@/shared/store/uiStore';
import { useDocumentStore } from '@/features/documents/store';
import { useTaskStore } from '@/features/tasks/store';
import { documentService } from '@/services/document.service';
import { taskService } from '@/services/task.service';
import { cn } from '@/shared/lib/utils';

const STYLE_PRESETS = [
  { id: 'Developer', title: 'Developer', description: 'Build projects, write documentation, and capture code snippets.', icon: <Terminal size={22} className="text-[#BDE0FE]" />, activeColor: '#BDE0FE' },
  { id: 'Student', title: 'Student', description: 'Track assignments, organize class lectures, and manage study guides.', icon: <GraduationCap size={22} className="text-[#B5EAD7]" />, activeColor: '#B5EAD7' },
  { id: 'Creator', title: 'Creator', description: 'Draft scripts, outline content ideas, and structure creative assets.', icon: <Palette size={22} className="text-[#FFC8DD]" />, activeColor: '#FFC8DD' },
  { id: 'Researcher', title: 'Researcher', description: 'Compile references, document experiments, and analyze findings.', icon: <Microscope size={22} className="text-[#95E1D3]" />, activeColor: '#95E1D3' },
  { id: 'Startup', title: 'Startup', description: 'Organize team syncs, write product requirements, and track roadmap.', icon: <RocketLaunch size={22} className="text-[#FFDAC1]" />, activeColor: '#FFDAC1' },
  { id: 'Personal', title: 'Personal', description: 'Journal daily thoughts, set life goals, and coordinate daily tasks.', icon: <User size={22} className="text-[#FFF5C3]" />, activeColor: '#FFF5C3' }
];

export const OnboardingScreen = () => {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [workspaceName, setWorkspaceName] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<'Developer' | 'Student' | 'Creator' | 'Researcher' | 'Startup' | 'Personal'>('Personal');
  const [selectedLoginIndex, setSelectedLoginIndex] = useState(0);
  const [creationProgress, setCreationProgress] = useState(0);
  const [creationComplete, setCreationComplete] = useState(false);

  const { setIsOnboardingCompleted } = useSettingsStore();

  const nameInputRef = useRef<HTMLInputElement>(null);

  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [activePages, setActivePages] = useState<{ id: string; title: string }[]>([]);

  const handleRemoveTag = React.useCallback((tag: string) => {
    setActiveTags(prev => prev.filter(t => t !== tag));
  }, []);

  const handleRemovePage = React.useCallback((id: string) => {
    setActivePages(prev => prev.filter(p => p.id !== id));
  }, []);

  const resetSeedingDefaults = React.useCallback(() => {
    let tags: string[];
    let pages: { id: string; title: string }[];

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');

    if (selectedStyle === 'Developer') {
      tags = ['development', 'backlog', 'bugs', 'docs', 'releases'];
      pages = [
        { id: 'welcome-doc', title: 'Welcome to Templnote' },
        { id: 'doc-dev-roadmap', title: 'Project Roadmap' },
        { id: 'doc-dev-setup', title: 'Local Setup Guide' },
        { id: 'doc-dev-api', title: 'API Reference Documentation' },
        { id: 'daily-note', title: `Daily Standup — ${yyyy}-${mm}-${dd}` }
      ];
    } else if (selectedStyle === 'Student') {
      tags = ['lectures', 'homework', 'exams', 'readings', 'schedule'];
      pages = [
        { id: 'welcome-doc', title: 'Welcome to Templnote' },
        { id: 'doc-stud-overview', title: 'Semester Overview' },
        { id: 'doc-stud-prep', title: 'Exam Preparation' },
        { id: 'doc-stud-schedule', title: 'Class Schedule' },
        { id: 'daily-note', title: `Daily Study Log — ${yyyy}-${mm}-${dd}` }
      ];
    } else if (selectedStyle === 'Creator') {
      tags = ['ideas', 'drafts', 'production', 'editing', 'published'];
      pages = [
        { id: 'welcome-doc', title: 'Welcome to Templnote' },
        { id: 'doc-creat-calendar', title: 'Content Calendar' },
        { id: 'doc-creat-script', title: 'Video Script: Desk Setup' },
        { id: 'doc-creat-brand', title: 'Brand Identity Guide' },
        { id: 'daily-note', title: `Creative Session Log — ${yyyy}-${mm}-${dd}` }
      ];
    } else if (selectedStyle === 'Researcher') {
      tags = ['literature', 'experiments', 'data', 'writing', 'references'];
      pages = [
        { id: 'welcome-doc', title: 'Welcome to Templnote' },
        { id: 'doc-res-thesis', title: 'Thesis Outline' },
        { id: 'doc-res-log', title: 'Experiment Logs' },
        { id: 'doc-res-grant', title: 'Grant Proposal Outline' },
        { id: 'daily-note', title: `Research Notes — ${yyyy}-${mm}-${dd}` }
      ];
    } else if (selectedStyle === 'Startup') {
      tags = ['strategy', 'product', 'growth', 'fundraising', 'meetings'];
      pages = [
        { id: 'welcome-doc', title: 'Welcome to Templnote' },
        { id: 'doc-start-onepager', title: 'One Pager Strategy' },
        { id: 'doc-start-prd', title: 'Product Spec: Onboarding' },
        { id: 'doc-start-pitch', title: 'Pitch Deck Outline' },
        { id: 'daily-note', title: `Daily Sync — ${yyyy}-${mm}-${dd}` }
      ];
    } else {
      tags = ['journal', 'goals', 'finance', 'health', 'reminders'];
      pages = [
        { id: 'welcome-doc', title: 'Welcome to Templnote' },
        { id: 'doc-pers-goals', title: 'Yearly Goals' },
        { id: 'doc-pers-reading', title: 'Reading List' },
        { id: 'doc-pers-health', title: 'Weekly Fitness Planner' },
        { id: 'daily-note', title: `Daily Journal — ${yyyy}-${mm}-${dd}` }
      ];
    }

    setActiveTags(tags);
    setActivePages(pages);
  }, [selectedStyle]);

  useEffect(() => {
    resetSeedingDefaults();
  }, [resetSeedingDefaults]);

  const nextStep = React.useCallback(() => {
    if (step === 1) setStep(2);
    else if (step === 2) setStep(3);
    else if (step === 3) setStep(4);
  }, [step]);

  const handleBack = React.useCallback(() => {
    if (step === 1 || step === 4) return;
    window.history.back();
  }, [step]);

  // Auto-focus input when entering Step 2
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 300);
    }
  }, [step]);

  // Centralized keyboard navigation for all steps
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Backspace navigates to the previous step if the user is not actively typing or if the focused input field is empty
      if (e.key === 'Backspace') {
        const activeEl = document.activeElement as HTMLInputElement | HTMLTextAreaElement | null;
        const isInputField = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
        const isContentEditable = activeEl && activeEl.getAttribute('contenteditable') === 'true';
        const isCurrentlyEmpty = isInputField ? !activeEl.value : (isContentEditable ? !activeEl.textContent : true);

        if ((!isInputField && !isContentEditable) || isCurrentlyEmpty) {
          handleBack();
          e.preventDefault();
          return;
        }
      }

      // Step 1: Login elements Up/Down navigation
      if (step === 1) {
        if (e.key === 'ArrowDown') {
          setSelectedLoginIndex((prev) => (prev + 1) % 3);
          e.preventDefault();
        } else if (e.key === 'ArrowUp') {
          setSelectedLoginIndex((prev) => (prev - 1 + 3) % 3);
          e.preventDefault();
        } else if (e.key === 'Enter') {
          nextStep();
          e.preventDefault();
        }
      }

      // Step 3: Style presets Up/Down/Left/Right grid navigation
      if (step === 3) {
        const currentIndex = STYLE_PRESETS.findIndex(p => p.id === selectedStyle);
        if (currentIndex !== -1) {
          const row = Math.floor(currentIndex / 2);
          const col = currentIndex % 2;
          let newIndex = currentIndex;

          if (e.key === 'ArrowRight') {
            if (col === 0) newIndex = currentIndex + 1;
            e.preventDefault();
          } else if (e.key === 'ArrowLeft') {
            if (col === 1) newIndex = currentIndex - 1;
            e.preventDefault();
          } else if (e.key === 'ArrowDown') {
            if (row < 2) newIndex = currentIndex + 2;
            e.preventDefault();
          } else if (e.key === 'ArrowUp') {
            if (row > 0) newIndex = currentIndex - 2;
            e.preventDefault();
          } else if (e.key === 'Enter') {
            nextStep();
            e.preventDefault();
          }

          if (newIndex !== currentIndex && newIndex >= 0 && newIndex < STYLE_PRESETS.length) {
            setSelectedStyle(STYLE_PRESETS[newIndex].id as any);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [step, selectedStyle, selectedLoginIndex, nextStep, handleBack]);

  // Sync onboarding steps with browser history (History API) to support browser back button navigation
  useEffect(() => {
    window.history.replaceState({ onboardingStep: 1 }, '');

    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.onboardingStep !== undefined) {
        setStep(e.state.onboardingStep);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Track last pushed history state to prevent redundant history pushes
  const lastPushedState = useRef({ step });

  useEffect(() => {
    if (step !== lastPushedState.current.step) {
      const isForward = step > lastPushedState.current.step;

      if (isForward && step !== 4) {
        window.history.pushState({ onboardingStep: step }, '');
      }
      lastPushedState.current = { step };
    }
  }, [step]);

  // Reset database seeding progress if navigating back before Step 4
  useEffect(() => {
    if (step < 4) {
      setCreationComplete(false);
      setCreationProgress(0);
    }
  }, [step]);

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
        const styleTags: string[] = [];

        if (selectedStyle === 'Developer') {
          styleTags.push('development', 'backlog', 'bugs', 'docs', 'releases');
          createdFolders.push(
            { id: 'folder-dev-projects', name: 'Projects' },
            { id: 'folder-dev-docs', name: 'Documentation' },
            { id: 'folder-dev-snippets', name: 'Snippets' }
          );
          createdDocs.push(
            {
              id: 'welcome-doc',
              title: 'Welcome to Templnote',
              folderId: null,
              tags: ['guide', 'dev'],
              content: `<h1>Welcome to your Developer Workspace</h1><p>Templnote is your calm, intelligent workspace for ideas, tasks, and code snippet references.</p><h3>Pro Tips:</h3><ul><li>Type <strong>/</strong> in this editor to insert tables, quotes, toggles, or code blocks.</li><li>Type <strong>@</strong> to link to other documents, tasks, or tags.</li><li>Press <strong>Tab</strong> to activate AI autocomplete on any paragraph.</li></ul>`
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
              id: 'doc-dev-api',
              title: 'API Reference Documentation',
              folderId: 'folder-dev-docs',
              tags: ['docs', 'development'],
              content: `<h1>API Reference Documentation</h1><p>Internal microservice endpoints specifications and schema structures.</p><h3>Endpoints</h3><ul><li><strong>GET /api/v1/notes:</strong> Retrieve paginated note listings.</li><li><strong>POST /api/v1/notes:</strong> Create a new workspace note.</li></ul><h3>Response Format</h3><pre><code>{
  "status": "success",
  "data": { "id": "note-123", "title": "Untitled" }
}</code></pre>`
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
          styleTags.push('lectures', 'homework', 'exams', 'readings', 'schedule');
          createdFolders.push(
            { id: 'folder-stud-classes', name: 'Classes' },
            { id: 'folder-stud-assign', name: 'Assignments' },
            { id: 'folder-stud-guides', name: 'Study Guides' }
          );
          createdDocs.push(
            {
              id: 'welcome-doc',
              title: 'Welcome to Templnote',
              folderId: null,
              tags: ['guide', 'school'],
              content: `<h1>Welcome to your Student Workspace</h1><p>Templnote helps you keep track of classes, notes, and deadlines without clutter. Here is your initial setup:</p><ul><li>Use folders to group notes by subject.</li><li>Create daily notes to structure your study sessions.</li></ul>`
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
              id: 'doc-stud-schedule',
              title: 'Class Schedule',
              folderId: 'folder-stud-classes',
              tags: ['schedule', 'lectures'],
              content: `<h1>Class Schedule & Info</h1><p>Overview of course syllabi, office hours, and lecture locations.</p><h3>Fall Semester</h3><ul><li><strong>CS 101:</strong> Professor John Doe, office hours Mon/Wed 2-4 PM.</li><li><strong>MATH 202:</strong> Professor Jane Smith, office hours Tue/Thu 1-3 PM.</li></ul>`
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
          styleTags.push('ideas', 'drafts', 'production', 'editing', 'published');
          createdFolders.push(
            { id: 'folder-creat-ideas', name: 'Ideas & Drafts' },
            { id: 'folder-creat-calendar', name: 'Content Calendar' },
            { id: 'folder-creat-assets', name: 'Assets' }
          );
          createdDocs.push(
            {
              id: 'welcome-doc',
              title: 'Welcome to Templnote',
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
              id: 'doc-creat-brand',
              title: 'Brand Identity Guide',
              folderId: 'folder-creat-assets',
              tags: ['ideas', 'drafts'],
              content: `<h1>Brand Identity & Assets Guide</h1><p>Standard design elements, typography guidelines, and active visual palettes.</p><h3>Color System</h3><ul><li>Primary Accent: Pastel Blue (<code>#BDE0FE</code>)</li><li>Secondary Accent: Pastel Mint (<code>#B5EAD7</code>)</li></ul><h3>Typography</h3><p>Use sans-serif clean geometric fonts for headings, and standard proportional serif for reading bodies.</p>`
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
          styleTags.push('literature', 'experiments', 'data', 'writing', 'references');
          createdFolders.push(
            { id: 'folder-res-lit', name: 'Literature Review' },
            { id: 'folder-res-exp', name: 'Experiments' },
            { id: 'folder-res-ref', name: 'References' }
          );
          createdDocs.push(
            {
              id: 'welcome-doc',
              title: 'Welcome to Templnote',
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
              id: 'doc-res-grant',
              title: 'Grant Proposal Outline',
              folderId: 'folder-res-ref',
              tags: ['writing', 'references'],
              content: `<h1>NSF Grant Proposal Draft</h1><p>Outline of research objectives, budget allocations, and key milestones.</p><h3>Executive Summary</h3><p>Research into scalable conflict-free replicated data storage architectures to optimize local-first web applications.</p><h3>Proposed Budget</h3><ul><li>Research assistants: $45,000</li><li>Travel and conferences: $5,000</li></ul>`
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
          styleTags.push('strategy', 'product', 'growth', 'fundraising', 'meetings');
          createdFolders.push(
            { id: 'folder-start-strategy', name: 'Pitch & Strategy' },
            { id: 'folder-start-team', name: 'Team Updates' },
            { id: 'folder-start-product', name: 'Product Specs' }
          );
          createdDocs.push(
            {
              id: 'welcome-doc',
              title: 'Welcome to Templnote',
              folderId: null,
              tags: ['guide', 'startup'],
              content: `<h1>Welcome to your Startup Workspace</h1><p>Align team targets, draft strategy documents, and manage software specifications.</p>`
            },
            {
              id: 'doc-start-onepager',
              title: 'One Pager Strategy',
              folderId: 'folder-start-strategy',
              tags: ['strategy'],
              content: `<h1>Templnote Strategy One-Pager</h1><p>Building the next-generation intelligent local-first productivity workspace for writers and developer teams.</p><h3>Target Audience</h3><p>Knowledge workers, developers, and writers seeking high-focus local-first tools.</p>`
            },
            {
              id: 'doc-start-prd',
              title: 'Product Spec: Onboarding',
              folderId: 'folder-start-product',
              tags: ['prd'],
              content: `<h1>Product Specs: Onboarding Experience</h1><h3>User Experience Target</h3><p>Frictionless onboarding that guides users in less than 60 seconds.</p>`
            },
            {
              id: 'doc-start-pitch',
              title: 'Pitch Deck Outline',
              folderId: 'folder-start-strategy',
              tags: ['strategy', 'fundraising'],
              content: `<h1>Startup Seed Pitch Narrative</h1><p>Slide outline, talking points, and data projections for the seed funding round.</p><h3>Slide List</h3><ul><li><strong>Slide 1: Problem:</strong> Information fragmentation in knowledge teams.</li><li><strong>Slide 2: Solution:</strong> Local-first collaborative workspace templnote.</li><li><strong>Slide 3: Market Size:</strong> $12B TAM in SaaS workspace automation.</li></ul>`
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
          styleTags.push('journal', 'goals', 'finance', 'health', 'reminders');
          createdFolders.push(
            { id: 'folder-pers-journal', name: 'Journal' },
            { id: 'folder-pers-goals', name: 'Goals' },
            { id: 'folder-pers-admin', name: 'Life Admin' }
          );
          createdDocs.push(
            {
              id: 'welcome-doc',
              title: 'Welcome to Templnote',
              folderId: null,
              tags: ['guide', 'personal'],
              content: `<h1>Welcome to Templnote</h1><p>This is your personal workspace for daily journals, goal-tracking, and managing tasks.</p>`
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
              id: 'doc-pers-health',
              title: 'Weekly Fitness Planner',
              folderId: 'folder-pers-admin',
              tags: ['health', 'goals'],
              content: `<h1>Weekly Fitness & Health Tracker</h1><p>Daily routines, workout sheets, and caloric targets.</p><h3>Weekly Routine</h3><ul><li>🏃‍♂️ Monday: Cardio run, 5km track.</li><li>🏋️‍♂️ Wednesday: Core strength lifting.</li><li>🧘‍♂️ Friday: Mindfulness stretching.</li></ul>`
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
        const activePageIds = activePages.map(p => p.id);
        const filteredDocs = createdDocs.filter(d => 
          activePageIds.includes(d.id.startsWith('daily-note-') ? 'daily-note' : d.id)
        );
        const filteredStyleTags = styleTags.filter(t => activeTags.includes(t));

        const docIds = filteredDocs.map(d => d.id);
        await documentService.setMetadata("folderOrder", folderIds);
        await documentService.setMetadata("documentOrder", docIds);
        await documentService.setMetadata("createdTags", filteredStyleTags);

        for (const doc of filteredDocs) {
          const docTags = doc.tags ? doc.tags.filter((t: string) => {
            const isStyleTag = styleTags.includes(t);
            if (isStyleTag && !activeTags.includes(t)) {
              return false;
            }
            return true;
          }) : [];

          await documentService.saveDocument({
            id: doc.id,
            title: doc.title,
            content: doc.content,
            tags: docTags,
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
          createdTags: filteredStyleTags,
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
  }, [step, selectedStyle, workspaceName, activeTags, activePages]);

  const handleFinishOnboarding = () => {
    setIsOnboardingCompleted(true);
    useUiStore.getState().startTutorial();
  };

  // Onboarding split-screen layouts
  const pageContainerClass = "absolute inset-0 flex w-full h-full bg-[#050505] z-[9999] select-none text-white overflow-hidden";

  return (
    <>
      {/* Inline styles for custom hardware-accelerated floating animation of the background */}
      <style dangerouslySetInnerHTML={{
        __html: `
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
            <div className="w-full md:w-[60%] h-full bg-[#050505] flex flex-col items-center justify-start overflow-y-auto p-6 md:p-10 relative z-10 no-scrollbar">
              <div className="my-auto w-full flex flex-col items-center">

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
                    onMouseEnter={() => setSelectedLoginIndex(0)}
                    className={cn(
                      "w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-zinc-950/70 border rounded-lg text-sm transition-all duration-200 cursor-pointer active:scale-[0.99] font-medium",
                      selectedLoginIndex === 0
                        ? "bg-[#FFB7B2]/10 border-[#FFB7B2]/50 text-white"
                        : "border-[#FFB7B2]/20 text-[#FFB7B2] hover:bg-[#FFB7B2]/10 hover:border-[#FFB7B2]/50 hover:text-white"
                    )}
                  >
                    <GoogleLogo size={18} className="text-[#FFB7B2]/80" />
                    Continue with Google
                  </button>

                  <button
                    onClick={nextStep}
                    onMouseEnter={() => setSelectedLoginIndex(1)}
                    className={cn(
                      "w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-zinc-950/70 border rounded-lg text-sm transition-all duration-200 cursor-pointer active:scale-[0.99] font-medium",
                      selectedLoginIndex === 1
                        ? "bg-[#BDE0FE]/10 border-[#BDE0FE]/50 text-white"
                        : "border-[#BDE0FE]/20 text-[#BDE0FE] hover:bg-[#BDE0FE]/10 hover:border-[#BDE0FE]/50 hover:text-white"
                    )}
                  >
                    <GithubLogo size={18} className="text-[#BDE0FE]/80" />
                    Continue with GitHub
                  </button>

                  <button
                    onClick={nextStep}
                    onMouseEnter={() => setSelectedLoginIndex(2)}
                    className={cn(
                      "w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-zinc-950/70 border rounded-lg text-sm transition-all duration-200 cursor-pointer active:scale-[0.99] font-medium",
                      selectedLoginIndex === 2
                        ? "bg-[#B5EAD7]/10 border-[#B5EAD7]/50 text-white"
                        : "border-[#B5EAD7]/20 text-[#B5EAD7] hover:bg-[#B5EAD7]/10 hover:border-[#B5EAD7]/50 hover:text-white"
                    )}
                  >
                    <Envelope size={18} className="text-[#B5EAD7]/80" />
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
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#BDE0FE]">Step 2 of 3</span>
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
                      className="w-full bg-transparent border-b border-[#BDE0FE]/30 focus:border-[#BDE0FE] outline-none text-lg text-center pb-2 text-zinc-100 placeholder-zinc-700 transition-colors"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && workspaceName.trim()) {
                          e.preventDefault();
                          e.stopPropagation();
                          nextStep();
                        }
                      }}
                    />

                    {workspaceName.trim() && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center text-[10px] text-[#BDE0FE]/70 font-mono"
                      >
                        press Enter ↵
                      </motion.div>
                    )}
                  </div>

                  <button
                    disabled={!workspaceName.trim()}
                    onClick={nextStep}
                    className="px-6 py-2 bg-[#BDE0FE] hover:bg-[#aed0ed] disabled:opacity-40 disabled:pointer-events-none text-zinc-950 text-sm font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    Continue
                    <ArrowRight size={14} weight="bold" />
                  </button>
                </motion.div>
              )}

              {/* Step 3: Choose Style */}
              {step === 3 && (
                <>
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full max-w-2xl flex flex-col items-center space-y-4 text-center"
                  >
                    <div className="space-y-2">
                      <span
                        className="text-[11px] font-semibold uppercase tracking-wider transition-colors"
                        style={{ color: STYLE_PRESETS.find(p => p.id === selectedStyle)?.activeColor || '#BDE0FE' }}
                      >
                        Step 3 of 3
                      </span>
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
                                ? ""
                                : "border-zinc-900 hover:border-zinc-800"
                            )}
                            style={isSelected ? { borderColor: preset.activeColor, backgroundColor: `${preset.activeColor}08` } : undefined}
                          >
                            <span className="mb-3 block">{preset.icon}</span>
                            <span
                              className={cn(
                                "text-xs font-semibold mb-1 transition-colors",
                                isSelected ? "" : "text-zinc-300 group-hover:text-zinc-200"
                              )}
                              style={isSelected ? { color: preset.activeColor } : undefined}
                            >
                              {preset.title}
                            </span>
                            <span className="text-[11px] leading-relaxed text-zinc-500 font-sans">
                              {preset.description}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={nextStep}
                      className="px-6 py-2.5 text-zinc-950 text-sm font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer active:scale-[0.98] shadow-sm"
                      style={{
                        backgroundColor: STYLE_PRESETS.find(p => p.id === selectedStyle)?.activeColor || '#BDE0FE'
                      }}
                    >
                      Create Workspace
                      <ArrowRight size={14} weight="bold" />
                    </button>
                  </motion.div>

                  {/* Seeding Customizer: Outside of style options div, horizontal single rows, all visible */}
                  <div className="w-full max-w-2xl flex flex-col space-y-3 pt-5 border-t border-zinc-900/40 mt-6 mx-auto">
                    {/* Tags Row */}
                    <div className="flex flex-row items-center gap-4 py-1.5">
                      <span
                        className="text-xs font-bold font-mono tracking-wider w-16 shrink-0 transition-colors text-left"
                        style={{ color: STYLE_PRESETS.find(p => p.id === selectedStyle)?.activeColor || '#BDE0FE' }}
                      >
                        TAGS
                      </span>
                      <div className="flex flex-row flex-wrap gap-1.5 flex-1 items-center">
                        {activeTags.length === 0 ? (
                          <span className="text-[11px] text-zinc-600 italic">No tags will be created</span>
                        ) : (
                          activeTags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1.5 text-[11px] font-mono bg-zinc-950/60 border border-zinc-900 text-zinc-400 hover:text-zinc-300 hover:border-zinc-800 py-1 px-3 rounded-full transition-all whitespace-nowrap"
                            >
                              #{tag}
                              <button
                                onClick={() => handleRemoveTag(tag)}
                                className="text-zinc-600 hover:text-red-400 p-0.5 transition-colors cursor-pointer flex items-center justify-center"
                              >
                                <X size={9} weight="bold" />
                              </button>
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Pages Row */}
                    <div className="flex flex-row items-center gap-4 py-1.5 pt-2.5 border-t border-zinc-900/10">
                      <span
                        className="text-xs font-bold font-mono tracking-wider w-16 shrink-0 transition-colors text-left"
                        style={{ color: STYLE_PRESETS.find(p => p.id === selectedStyle)?.activeColor || '#BDE0FE' }}
                      >
                        PAGES
                      </span>
                      <div className="flex flex-row flex-wrap gap-1.5 flex-1 items-center">
                        {activePages.length === 0 ? (
                          <span className="text-[11px] text-zinc-600 italic">No pages will be created</span>
                        ) : (
                          activePages.map((page) => (
                            <span
                              key={page.id}
                              className="inline-flex items-center gap-1.5 text-[11px] font-sans bg-zinc-950/60 border border-zinc-900 text-zinc-300 hover:text-zinc-200 hover:border-zinc-800 py-1 px-3 rounded-full transition-all whitespace-nowrap"
                              title={page.title}
                            >
                              <FileText size={11} className="text-zinc-500 flex-shrink-0" />
                              <span>{page.title}</span>
                              <button
                                onClick={() => handleRemovePage(page.id)}
                                className="text-zinc-600 hover:text-red-400 p-0.5 transition-colors cursor-pointer flex items-center justify-center"
                              >
                                <X size={9} weight="bold" />
                              </button>
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Reset Button */}
                    {(activeTags.length < 5 || activePages.length < 5) && (
                      <div className="pt-2 text-center">
                        <button
                          onClick={resetSeedingDefaults}
                          className="text-[10px] font-bold text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer uppercase tracking-wider underline active:scale-95"
                        >
                          Reset Seeding Defaults
                        </button>
                      </div>
                    )}
                  </div>
                </>
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
                  <div
                    className="w-12 h-12 flex items-center justify-center rounded-full bg-zinc-950/80 border relative transition-colors duration-300"
                    style={{ borderColor: creationComplete ? '#B5EAD7' : (STYLE_PRESETS.find(p => p.id === selectedStyle)?.activeColor || '#BDE0FE') }}
                  >
                    <AnimatePresence mode="wait">
                      {!creationComplete ? (
                        <motion.div
                          key="loading-spinner"
                          initial={{ opacity: 0, rotate: 0 }}
                          animate={{ opacity: 1, rotate: 360 }}
                          exit={{ opacity: 0 }}
                          transition={{ rotate: { repeat: Infinity, duration: 1.2, ease: "linear" } }}
                          style={{ color: STYLE_PRESETS.find(p => p.id === selectedStyle)?.activeColor || '#BDE0FE' }}
                        >
                          <CircleNotch size={20} className="animate-spin" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="check-icon"
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-[#B5EAD7]"
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
                      className="h-full bg-[#BDE0FE]"
                      initial={{ width: '0%' }}
                      animate={{ width: `${creationProgress}%` }}
                      transition={{ ease: 'easeOut' }}
                      style={{
                        background: `linear-gradient(to right, ${STYLE_PRESETS.find(p => p.id === selectedStyle)?.activeColor || '#BDE0FE'}, #B5EAD7)`
                      }}
                    />
                  </div>
                </motion.div>
              )}
              </div>
            </div>

            {/* RIGHT SIDE (40%): Floating Graffiti Background + welcome to notemple story */}
            <div className="hidden md:flex w-[40%] h-full overflow-hidden border-l border-zinc-900 flex-col justify-between p-12 text-left bg-zinc-950 relative z-10">
              <div className="graffiti-backdrop" />
              <div className="graffiti-ambient-overlay" />

              <div className="relative z-10 flex flex-col h-full justify-between text-left">
                {/* Brand title: split-line templ + note at the top taking full width */}
                <div className="w-full pt-4">
                  <h1 className="text-[16vw] md:text-[6.5vw] font-black leading-[0.8] tracking-tighter bg-gradient-to-br from-[#BDE0FE] via-[#FFC8DD] to-[#B5EAD7] bg-clip-text text-transparent font-sans lowercase select-none">
                    templ<br />
                    note
                  </h1>
                  <h2 className="text-[10px] font-semibold tracking-[0.25em] text-zinc-500 uppercase font-mono mt-4">
                    AI-Enhanced Minimal Workspace
                  </h2>
                </div>

                {/* Narrative step texts: positioned bottom-left */}
                <div className="mt-auto mb-6 max-w-sm mr-auto text-left w-full">
                  <AnimatePresence mode="wait">
                    {step === 1 && (
                      <motion.div
                        key="story-1"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-2.5 flex flex-col items-start"
                      >
                        <h3 className="text-xl md:text-2xl font-bold tracking-tight text-[#FFB7B2]">Welcome</h3>
                        <p className="text-sm md:text-base leading-relaxed text-zinc-400 font-sans max-w-[280px] md:max-w-xs">
                          Templnote is designed to be a friction-free environment for your notes, focus, and tasks. A place to write, plan, and think without clutter.
                        </p>
                      </motion.div>
                    )}
                    {step === 2 && (
                      <motion.div
                        key="story-2"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-2.5 flex flex-col items-start"
                      >
                        <h3 className="text-xl md:text-2xl font-bold tracking-tight text-[#BDE0FE]">Our Story</h3>
                        <p className="text-sm md:text-base leading-relaxed text-zinc-400 font-sans max-w-[280px] md:max-w-xs">
                          Templnote was built from a simple realization: modern productivity tools have too many boxes and templates. We wanted a place that feels like a clean physical notebook, but runs on an intelligent local-first sync engine.
                        </p>
                      </motion.div>
                    )}
                    {step === 3 && (
                      <motion.div
                        key="story-3"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-2.5 flex flex-col items-start"
                      >
                        <h3 className="text-xl md:text-2xl font-bold tracking-tight text-[#B5EAD7]">How It's Better</h3>
                        <p className="text-sm md:text-base leading-relaxed text-zinc-400 font-sans max-w-[280px] md:max-w-xs">
                          By aligning folders, default templates, and daily notes with your selected workspace style, Templnote adapts to you from the start. No complex configurations, no empty space. Just write.
                        </p>
                      </motion.div>
                    )}
                    {step === 4 && (
                      <motion.div
                        key="story-4"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-2.5 flex flex-col items-start"
                      >
                        <h3 className="text-xl md:text-2xl font-bold tracking-tight text-[#FFDAC1]">Workspace Seeding</h3>
                        <p className="text-sm md:text-base leading-relaxed text-zinc-400 font-sans max-w-[280px] md:max-w-xs">
                          We are seeding your database with folders and daily note templates tailored to your profile. This will take only a second.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Footer copyright */}
                <div className="text-[9px] text-zinc-600 font-mono tracking-wider text-left w-full">
                  © 2026 Templnote Inc.
                </div>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Step 5: Final Done Screen */}
      {step === 5 && (
        <motion.div
          key="step5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={pageContainerClass}
          style={{
            background: 'radial-gradient(circle at center, rgba(189, 224, 254, 0.04) 0%, #050505 85%)'
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-sm flex flex-col items-center text-center space-y-8 relative z-10"
          >
            <div className="relative w-16 h-16 flex items-center justify-center rounded-full bg-zinc-950 border border-[#B5EAD7]/30 shadow-md">
              <div className="absolute inset-0 rounded-full bg-[#B5EAD7]/5 animate-pulse" />
              <Check className="text-[#B5EAD7] relative z-10" size={24} weight="bold" />
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
              className="w-full max-w-xs py-2.5 px-4 bg-[#B5EAD7] hover:bg-[#a3d8c4] text-zinc-950 text-sm font-semibold rounded-lg shadow-sm hover:shadow-green-500/10 active:scale-[0.99] transition-all cursor-pointer"
            >
              Open Workspace
            </button>
          </motion.div>
        </motion.div>
      )}

      {step > 1 && step !== 4 && step !== 5 && (
        <button
          onClick={handleBack}
          className="absolute top-8 left-8 flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-[#BDE0FE] transition-colors cursor-pointer group z-[99999] pointer-events-auto"
        >
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
          Back
        </button>
      )}
    </>
  );
};
