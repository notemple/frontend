import { useDocumentStore } from '@/features/documents/store';
import { useSettingsStore } from '@/features/settings/store';
import { useTaskStore } from '@/features/tasks/store';
import { documentService } from '@/services/document.service';
import { taskService } from '@/services/task.service';
import { cn } from '@/shared/lib/utils';
import { useUiStore } from '@/shared/store/uiStore';
import { ArrowLeft } from '@phosphor-icons/react';
import { AnimatePresence,motion } from 'motion/react';
import React,{ useEffect,useRef,useState } from 'react';

import { LoginStep } from './components/LoginStep';
import { NameStep } from './components/NameStep';
import { SeedingStep } from './components/SeedingStep';
import { StoryPanel } from './components/StoryPanel';
import type { PresetStyle } from './components/StyleStep';
import { STYLE_PRESETS,StyleStep } from './components/StyleStep';

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
        { id: 'welcome-doc', title: 'Welcome to Templnote' }
      ];
    } else if (selectedStyle === 'Student') {
      tags = ['lectures', 'homework', 'exams', 'readings', 'schedule'];
      pages = [
        { id: 'welcome-doc', title: 'Welcome to Templnote' }
      ];
    } else if (selectedStyle === 'Creator') {
      tags = ['ideas', 'drafts', 'production', 'editing', 'published'];
      pages = [
        { id: 'welcome-doc', title: 'Welcome to Templnote' }
      ];
    } else if (selectedStyle === 'Researcher') {
      tags = ['literature', 'experiments', 'data', 'writing', 'references'];
      pages = [
        { id: 'welcome-doc', title: 'Welcome to Templnote' }
      ];
    } else if (selectedStyle === 'Startup') {
      tags = ['strategy', 'product', 'growth', 'fundraising', 'meetings'];
      pages = [
        { id: 'welcome-doc', title: 'Welcome to Templnote' }
      ];
    } else {
      tags = ['journal', 'goals', 'finance', 'health', 'reminders'];
      pages = [
        { id: 'welcome-doc', title: 'Welcome to Templnote' }
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
              icon: '💻',
              folderId: null,
              tags: ['guide', 'dev'],
              content: `<h1>Welcome to your Developer Workspace</h1>
<p>Templnote is a high-performance local-first developer environment tailored for flow state. Manage codebases, track features, and write clean markdown documentation side-by-side.</p>

<hr />

<h3>🚀 Core Editor Features</h3>
<p>Our editor gives you total control using keyboard-driven interactions and Markdown syntax. Try these commands inside the editor:</p>

<ul>
  <li><strong>/ Command Menu</strong>: Hit <code>/</code> on any blank line to insert tables, toggles, callouts, checklists, and formatted code blocks.</li>
  <li><strong>@ References</strong>: Type <code>@</code> to search and link directly to another page, active task list, or tag.</li>
  <li><strong>AI Autocomplete</strong>: Type part of a sentence and press <code>Tab</code> to let our offline-first AI predict the next code block or sentence.</li>
  <li><strong>Split Pane View</strong>: Open side-by-side tabs by dragging them to the side or right-clicking a tab.</li>
</ul>

<hr />

<h3>⌨️ Editor Shortcut Guide</h3>
<table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px;">
  <thead>
    <tr style="border-bottom: 2px solid rgba(255,255,255,0.1); text-align: left;">
      <th style="padding: 8px 12px; color: #a1a1aa;">Action</th>
      <th style="padding: 8px 12px; color: #a1a1aa;">Shortcut</th>
    </tr>
  </thead>
  <tbody>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 8px 12px; color: #e4e4e7;">Toggle Left Sidebar</td>
      <td style="padding: 8px 12px; color: #BDE0FE; font-family: monospace;">Ctrl + Alt + L</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 8px 12px; color: #e4e4e7;">Toggle Right Sidebar</td>
      <td style="padding: 8px 12px; color: #BDE0FE; font-family: monospace;">Ctrl + Alt + R</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 8px 12px; color: #e4e4e7;">Toggle Top Navbar</td>
      <td style="padding: 8px 12px; color: #BDE0FE; font-family: monospace;">Ctrl + Alt + T</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 8px 12px; color: #e4e4e7;">Change Tab Item</td>
      <td style="padding: 8px 12px; color: #BDE0FE; font-family: monospace;">Ctrl + Alt + ← / →</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 8px 12px; color: #e4e4e7;">Change Pane</td>
      <td style="padding: 8px 12px; color: #BDE0FE; font-family: monospace;">Ctrl + Alt + H / J</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 8px 12px; color: #e4e4e7;">Split Pane</td>
      <td style="padding: 8px 12px; color: #BDE0FE; font-family: monospace;">Ctrl + Alt + N</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 8px 12px; color: #e4e4e7;">Close Active Pane</td>
      <td style="padding: 8px 12px; color: #BDE0FE; font-family: monospace;">Ctrl + Alt + Q</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 8px 12px; color: #e4e4e7;">Document Search</td>
      <td style="padding: 8px 12px; color: #BDE0FE; font-family: monospace;">Ctrl + K</td>
    </tr>
  </tbody>
</table>`
            }
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
              icon: '🎓',
              folderId: null,
              tags: ['guide', 'school'],
              content: `<h1>Welcome to your Student Workspace</h1>
<p>Organize your academic life. Templnote brings class notes, study schedules, and reading checksheets together into one gorgeous workspace.</p>

<hr />

<h3>📚 Core Study Features</h3>
<ul>
  <li><strong>Inline Flashcards & Toggles</strong>: Type <code>/toggle</code> to create collapsible answers for self-testing.</li>
  <li><strong>Document Backlinking</strong>: Link lectures to reading logs using <code>@</code> to build your study graph.</li>
  <li><strong>Daily Standup Logs</strong>: Track tasks, habits, and lectures every single day.</li>
</ul>

<hr />

<h3>⌨️ Keyboard Shortcuts Guide</h3>
<table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px;">
  <thead>
    <tr style="border-bottom: 2px solid rgba(255,255,255,0.1); text-align: left;">
      <th style="padding: 8px 12px; color: #a1a1aa;">Action</th>
      <th style="padding: 8px 12px; color: #a1a1aa;">Shortcut</th>
    </tr>
  </thead>
  <tbody>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 8px 12px; color: #e4e4e7;">Toggle Left Sidebar</td>
      <td style="padding: 8px 12px; color: #B5EAD7; font-family: monospace;">Ctrl + Alt + L</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 8px 12px; color: #e4e4e7;">Toggle Right Sidebar</td>
      <td style="padding: 8px 12px; color: #B5EAD7; font-family: monospace;">Ctrl + Alt + R</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 8px 12px; color: #e4e4e7;">Toggle Top Navbar</td>
      <td style="padding: 8px 12px; color: #B5EAD7; font-family: monospace;">Ctrl + Alt + T</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 8px 12px; color: #e4e4e7;">Change Tab Item</td>
      <td style="padding: 8px 12px; color: #B5EAD7; font-family: monospace;">Ctrl + Alt + ← / →</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 8px 12px; color: #e4e4e7;">Change Pane</td>
      <td style="padding: 8px 12px; color: #B5EAD7; font-family: monospace;">Ctrl + Alt + H / J</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 8px 12px; color: #e4e4e7;">Split Pane</td>
      <td style="padding: 8px 12px; color: #B5EAD7; font-family: monospace;">Ctrl + Alt + N</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 8px 12px; color: #e4e4e7;">Close Active Pane</td>
      <td style="padding: 8px 12px; color: #B5EAD7; font-family: monospace;">Ctrl + Alt + Q</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 8px 12px; color: #e4e4e7;">Document Search</td>
      <td style="padding: 8px 12px; color: #B5EAD7; font-family: monospace;">Ctrl + K</td>
    </tr>
  </tbody>
</table>`
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
              icon: '🎨',
              folderId: null,
              tags: ['guide', 'creative'],
              content: `<h1>Welcome to your Creator Workspace</h1>
<p>Ditch the chaos. Brainstorm video setups, write copy drafts, and coordinate assets in an aesthetic environment structured for creators.</p>

<hr />

<h3>🎬 Custom Creator Tools</h3>
<ul>
  <li><strong>Asset Previews & Embeds</strong>: Drag in visual mockups or media guidelines directly into your workflow.</li>
  <li><strong>Dynamic Callouts</strong>: Highlight essential notes, sound bites, or scripting targets using <code>/callout</code>.</li>
</ul>

<hr />

<h3>⌨️ Keyboard Shortcuts Guide</h3>
<table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px;">
  <thead>
    <tr style="border-bottom: 2px solid rgba(255,255,255,0.1); text-align: left;">
      <th style="padding: 8px 12px; color: #a1a1aa;">Action</th>
      <th style="padding: 8px 12px; color: #a1a1aa;">Shortcut</th>
    </tr>
  </thead>
  <tbody>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 8px 12px; color: #e4e4e7;">Toggle Left Sidebar</td>
      <td style="padding: 8px 12px; color: #FFC8DD; font-family: monospace;">Ctrl + Alt + L</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 8px 12px; color: #e4e4e7;">Toggle Right Sidebar</td>
      <td style="padding: 8px 12px; color: #FFC8DD; font-family: monospace;">Ctrl + Alt + R</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 8px 12px; color: #e4e4e7;">Toggle Top Navbar</td>
      <td style="padding: 8px 12px; color: #FFC8DD; font-family: monospace;">Ctrl + Alt + T</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 8px 12px; color: #e4e4e7;">Change Tab Item</td>
      <td style="padding: 8px 12px; color: #FFC8DD; font-family: monospace;">Ctrl + Alt + ← / →</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 8px 12px; color: #e4e4e7;">Change Pane</td>
      <td style="padding: 8px 12px; color: #FFC8DD; font-family: monospace;">Ctrl + Alt + H / J</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 8px 12px; color: #e4e4e7;">Split Pane</td>
      <td style="padding: 8px 12px; color: #FFC8DD; font-family: monospace;">Ctrl + Alt + N</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 8px 12px; color: #e4e4e7;">Close Active Pane</td>
      <td style="padding: 8px 12px; color: #FFC8DD; font-family: monospace;">Ctrl + Alt + Q</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 8px 12px; color: #e4e4e7;">Document Search</td>
      <td style="padding: 8px 12px; color: #FFC8DD; font-family: monospace;">Ctrl + K</td>
    </tr>
  </tbody>
</table>`
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
              icon: '🔬',
              folderId: null,
              tags: ['guide', 'research'],
              content: `<h1>Welcome to your Research Workspace</h1>
<p>Connect theories, compile citations, and analyze experimental results within a distraction-free repository.</p>

<hr />

<h3>🧪 Advanced Editor Features</h3>
<ul>
  <li><strong>Tables & Datasets</strong>: Insert tables using <code>/table</code> to track variables and logs instantly.</li>
  <li><strong>Document Connections</strong>: Create nested topic webs using link structures and <code>@</code> tag relationships.</li>
</ul>

<hr />

<h3>⌨️ Keyboard Shortcuts Guide</h3>
<table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px;">
  <thead>
    <tr style="border-bottom: 2px solid rgba(255,255,255,0.1); text-align: left;">
      <th style="padding: 8px 12px; color: #a1a1aa;">Action</th>
      <th style="padding: 8px 12px; color: #a1a1aa;">Shortcut</th>
    </tr>
  </thead>
  <tbody>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 8px 12px; color: #e4e4e7;">Toggle Left Sidebar</td>
      <td style="padding: 8px 12px; color: #95E1D3; font-family: monospace;">Ctrl + Alt + L</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 8px 12px; color: #e4e4e7;">Toggle Right Sidebar</td>
      <td style="padding: 8px 12px; color: #95E1D3; font-family: monospace;">Ctrl + Alt + R</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 8px 12px; color: #e4e4e7;">Toggle Top Navbar</td>
      <td style="padding: 8px 12px; color: #95E1D3; font-family: monospace;">Ctrl + Alt + T</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 8px 12px; color: #e4e4e7;">Change Tab Item</td>
      <td style="padding: 8px 12px; color: #95E1D3; font-family: monospace;">Ctrl + Alt + ← / →</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 8px 12px; color: #e4e4e7;">Change Pane</td>
      <td style="padding: 8px 12px; color: #95E1D3; font-family: monospace;">Ctrl + Alt + H / J</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 8px 12px; color: #e4e4e7;">Split Pane</td>
      <td style="padding: 8px 12px; color: #95E1D3; font-family: monospace;">Ctrl + Alt + N</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 8px 12px; color: #e4e4e7;">Close Active Pane</td>
      <td style="padding: 8px 12px; color: #95E1D3; font-family: monospace;">Ctrl + Alt + Q</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 8px 12px; color: #e4e4e7;">Document Search</td>
      <td style="padding: 8px 12px; color: #95E1D3; font-family: monospace;">Ctrl + K</td>
    </tr>
  </tbody>
</table>`
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
              icon: '🚀',
              folderId: null,
              tags: ['guide', 'startup'],
              content: `<h1>Welcome to your Startup Workspace</h1>
<p>Build and scale. Templnote aggregates product roadmaps, strategy documents, pitch narrative files, and team updates in a secure space.</p>

<hr />

<h3>💼 Editor Features for Teams</h3>
<ul>
  <li><strong>Bullet & Task lists</strong>: Format itemized lists easily via <code>/bullet</code> or <code>/todo</code>.</li>
  <li><strong>Headers hierarchy</strong>: Separate strategies using formatted H1, H2, and H3 sizes.</li>
</ul>

<hr />

<h3>⌨️ Keyboard Shortcuts Guide</h3>
<table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px;">
  <thead>
    <tr style="border-bottom: 2px solid rgba(255,255,255,0.1); text-align: left;">
      <th style="padding: 8px 12px; color: #a1a1aa;">Action</th>
      <th style="padding: 8px 12px; color: #a1a1aa;">Shortcut</th>
    </tr>
  </thead>
  <tbody>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 8px 12px; color: #e4e4e7;">Toggle Left Sidebar</td>
      <td style="padding: 8px 12px; color: #FFDAC1; font-family: monospace;">Ctrl + Alt + L</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 8px 12px; color: #e4e4e7;">Toggle Right Sidebar</td>
      <td style="padding: 8px 12px; color: #FFDAC1; font-family: monospace;">Ctrl + Alt + R</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 8px 12px; color: #e4e4e7;">Toggle Top Navbar</td>
      <td style="padding: 8px 12px; color: #FFDAC1; font-family: monospace;">Ctrl + Alt + T</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 8px 12px; color: #e4e4e7;">Change Tab Item</td>
      <td style="padding: 8px 12px; color: #FFDAC1; font-family: monospace;">Ctrl + Alt + ← / →</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 8px 12px; color: #e4e4e7;">Change Pane</td>
      <td style="padding: 8px 12px; color: #FFDAC1; font-family: monospace;">Ctrl + Alt + H / J</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 8px 12px; color: #e4e4e7;">Split Pane</td>
      <td style="padding: 8px 12px; color: #FFDAC1; font-family: monospace;">Ctrl + Alt + N</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 8px 12px; color: #e4e4e7;">Close Active Pane</td>
      <td style="padding: 8px 12px; color: #FFDAC1; font-family: monospace;">Ctrl + Alt + Q</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 8px 12px; color: #e4e4e7;">Document Search</td>
      <td style="padding: 8px 12px; color: #FFDAC1; font-family: monospace;">Ctrl + K</td>
    </tr>
  </tbody>
</table>`
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
              icon: '👤',
              folderId: null,
              tags: ['guide', 'personal'],
              content: `<h1>Welcome to Templnote</h1>
<p>Your minimalist home for daily reflection, tracking life goals, and structuring routines without noise.</p>

<hr />

<h3>🌱 Personal Features</h3>
<ul>
  <li><strong>Bullet journals & checklists</strong>: Format checkboxes or numbered outlines quickly.</li>
  <li><strong>Linked references</strong>: Reference tags using <code>@</code> to build an connected logbook.</li>
</ul>

<hr />

<h3>⌨️ Keyboard Shortcuts Guide</h3>
<table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px;">
  <thead>
    <tr style="border-bottom: 2px solid rgba(255,255,255,0.1); text-align: left;">
      <th style="padding: 8px 12px; color: #a1a1aa;">Action</th>
      <th style="padding: 8px 12px; color: #a1a1aa;">Shortcut</th>
    </tr>
  </thead>
  <tbody>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 8px 12px; color: #e4e4e7;">Toggle Left Sidebar</td>
      <td style="padding: 8px 12px; color: #FFF5C3; font-family: monospace;">Ctrl + Alt + L</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 8px 12px; color: #e4e4e7;">Toggle Right Sidebar</td>
      <td style="padding: 8px 12px; color: #FFF5C3; font-family: monospace;">Ctrl + Alt + R</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 8px 12px; color: #e4e4e7;">Toggle Top Navbar</td>
      <td style="padding: 8px 12px; color: #FFF5C3; font-family: monospace;">Ctrl + Alt + T</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 8px 12px; color: #e4e4e7;">Change Tab Item</td>
      <td style="padding: 8px 12px; color: #FFF5C3; font-family: monospace;">Ctrl + Alt + ← / →</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 8px 12px; color: #e4e4e7;">Change Pane</td>
      <td style="padding: 8px 12px; color: #FFF5C3; font-family: monospace;">Ctrl + Alt + H / J</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 8px 12px; color: #e4e4e7;">Split Pane</td>
      <td style="padding: 8px 12px; color: #FFF5C3; font-family: monospace;">Ctrl + Alt + N</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 8px 12px; color: #e4e4e7;">Close Active Pane</td>
      <td style="padding: 8px 12px; color: #FFF5C3; font-family: monospace;">Ctrl + Alt + Q</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 8px 12px; color: #e4e4e7;">Document Search</td>
      <td style="padding: 8px 12px; color: #FFF5C3; font-family: monospace;">Ctrl + K</td>
    </tr>
  </tbody>
</table>`
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
          // No default tasks for Personal style
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
            icon: doc.icon,
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

        // Onboarding helper tasks omitted per user request

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
            // Directly trigger the tutorial/autohide selections instead of going to step 5 (Done screen)
            handleFinishOnboarding();
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

  const [showTutorialPrompt, setShowTutorialPrompt] = useState(false);

  const handleFinishOnboarding = () => {
    setShowTutorialPrompt(true);
  };

  const [showAutohidePrompt, setShowAutohidePrompt] = useState(false);

  const handleChooseTutorial = (wantsTutorial: boolean) => {
    setShowTutorialPrompt(false);
    if (wantsTutorial) {
      setIsOnboardingCompleted(true);
      // Start tutorial: starts in Glance and toggles tutorial active state
      useUiStore.getState().startTutorial();
    } else {
      // Prompt user with autohide preferences dialog first before finishing onboarding
      setShowAutohidePrompt(true);
    }
  };

  const handleFinishWithAutohide = (hideSidebars: boolean, hideNavbar: boolean) => {
    // Save selections to SettingsStore
    useSettingsStore.getState().setAutoHideSidebars(hideSidebars);
    useSettingsStore.getState().setAutoHideNavbar(hideNavbar);
    
    setIsOnboardingCompleted(true);
    setShowAutohidePrompt(false);
    
    // Jump directly to the auto-generated page ('welcome-doc')
    useUiStore.getState().openDocument('welcome-doc');
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

      {step > 1 && step !== 4 && (
        <button
          onClick={handleBack}
          className="absolute top-8 left-8 flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-[#BDE0FE] transition-colors cursor-pointer group z-[99999] pointer-events-auto bg-transparent border-none"
        >
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
          Back
        </button>
      )}

      {/* Premium Tutorial Choice Dialog */}
      <AnimatePresence>
        {showTutorialPrompt && (
          <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-xl p-6 shadow-2xl text-left"
              style={{
                background: 'linear-gradient(180deg, #09090b 0%, #030303 100%)',
              }}
            >
              <h2 className="text-lg font-semibold text-zinc-100 font-sans tracking-tight mb-2">
                Quick Interactive Tutorial?
              </h2>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed mb-6">
                Would you like a brief, interactive walkthrough of the workspace features? Or would you prefer to dive straight into your new document?
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => handleChooseTutorial(false)}
                  className="px-4 py-2 bg-transparent hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-medium rounded-lg transition-all cursor-pointer"
                >
                  Skip to Document
                </button>
                <button
                  onClick={() => handleChooseTutorial(true)}
                  className="px-4 py-2 bg-[#B5EAD7] hover:bg-[#a3d8c4] text-zinc-950 text-xs font-semibold rounded-lg shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                >
                  Start Tutorial
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Autohide Preferences Config Dialog */}
      <AnimatePresence>
        {showAutohidePrompt && (
          <AutohideConfigDialog onFinish={handleFinishWithAutohide} />
        )}
      </AnimatePresence>
    </>
  );
};

// Helper component for clean modularity
const AutohideConfigDialog = ({ onFinish }: { onFinish: (hideSidebars: boolean, hideNavbar: boolean) => void }) => {
  const [hideSidebars, setHideSidebars] = useState(false);
  const [hideNavbar, setHideNavbar] = useState(false);

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-xl p-6 shadow-2xl text-left"
        style={{
          background: 'linear-gradient(180deg, #09090b 0%, #030303 100%)',
        }}
      >
        <h2 className="text-lg font-semibold text-zinc-100 font-sans tracking-tight mb-2">
          Configure Navigation Layout
        </h2>
        <p className="text-xs text-zinc-400 font-sans leading-relaxed mb-6">
          Optimize your screen space. Toggle these autohide configurations to keep your workspace distraction-free.
        </p>

        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="max-w-[75%]">
              <p className="text-xs font-semibold text-zinc-200">Autohide Sidebars</p>
              <p className="text-[10px] text-zinc-500">Automatically collapse panels; open them by hovering the screen edge.</p>
              {!hideSidebars && (
                <p className="text-[10px] text-emerald-400/90 font-mono mt-1">Shortcut: Ctrl + Alt + L / R to toggle panels manually</p>
              )}
            </div>
            <button
              onClick={() => setHideSidebars(!hideSidebars)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                hideSidebars ? "bg-emerald-500/80" : "bg-zinc-800"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                  hideSidebars ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="max-w-[75%]">
              <p className="text-xs font-semibold text-zinc-200">Autohide Top Navbar</p>
              <p className="text-[10px] text-zinc-500">Hide navigation header unless mouse moves near the top edge.</p>
              {!hideNavbar && (
                <p className="text-[10px] text-emerald-400/90 font-mono mt-1">Shortcut: Ctrl + Alt + T to toggle navbar manually</p>
              )}
            </div>
            <button
              onClick={() => setHideNavbar(!hideNavbar)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                hideNavbar ? "bg-emerald-500/80" : "bg-zinc-800"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                  hideNavbar ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button
            onClick={() => onFinish(hideSidebars, hideNavbar)}
            className="px-5 py-2.5 bg-[#B5EAD7] hover:bg-[#a3d8c4] text-zinc-950 text-xs font-semibold rounded-lg shadow-sm active:scale-[0.98] transition-all cursor-pointer w-full text-center"
          >
            Apply & Enter Workspace
          </button>
        </div>
      </motion.div>
    </div>
  );
};
