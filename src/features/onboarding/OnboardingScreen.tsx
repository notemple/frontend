import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft } from '@phosphor-icons/react';
import { useSettingsStore } from '@/features/settings/store';
import { useUiStore } from '@/shared/store/uiStore';
import { useDocumentStore } from '@/features/documents/store';
import { useTaskStore } from '@/features/tasks/store';
import { documentService } from '@/services/document.service';
import { taskService } from '@/services/task.service';

import { LoginStep } from './components/LoginStep';
import { NameStep } from './components/NameStep';
import { StyleStep, STYLE_PRESETS } from './components/StyleStep';
import type { PresetStyle } from './components/StyleStep';
import { SeedingStep } from './components/SeedingStep';
import { DoneStep } from './components/DoneStep';
import { StoryPanel } from './components/StoryPanel';

export const OnboardingScreen = () => {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [workspaceName, setWorkspaceName] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<PresetStyle>('Personal');
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
            setSelectedStyle(STYLE_PRESETS[newIndex].id as PresetStyle);
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
                {step === 1 && (
                  <LoginStep
                    selectedLoginIndex={selectedLoginIndex}
                    setSelectedLoginIndex={setSelectedLoginIndex}
                    nextStep={nextStep}
                  />
                )}
                {step === 2 && (
                  <NameStep
                    nameInputRef={nameInputRef}
                    workspaceName={workspaceName}
                    setWorkspaceName={setWorkspaceName}
                    nextStep={nextStep}
                  />
                )}
                {step === 3 && (
                  <StyleStep
                    selectedStyle={selectedStyle}
                    setSelectedStyle={setSelectedStyle}
                    nextStep={nextStep}
                    activeTags={activeTags}
                    handleRemoveTag={handleRemoveTag}
                    activePages={activePages}
                    handleRemovePage={handleRemovePage}
                    resetSeedingDefaults={resetSeedingDefaults}
                  />
                )}
                {step === 4 && (
                  <SeedingStep
                    creationComplete={creationComplete}
                    creationProgress={creationProgress}
                    selectedStyle={selectedStyle}
                  />
                )}
              </div>
            </div>

            {/* RIGHT SIDE (40%): Floating Graffiti Background + welcome story */}
            <StoryPanel step={step} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step 5: Final Done Screen */}
      {step === 5 && (
        <DoneStep handleFinishOnboarding={handleFinishOnboarding} />
      )}

      {step > 1 && step !== 4 && step !== 5 && (
        <button
          onClick={handleBack}
          className="absolute top-8 left-8 flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-[#BDE0FE] transition-colors cursor-pointer group z-[99999] pointer-events-auto bg-transparent border-none"
        >
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
          Back
        </button>
      )}
    </>
  );
};
