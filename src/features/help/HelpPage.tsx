import {
	CaretDown,
	Command,
	FileText,
	Keyboard,
	Tag
} from '@phosphor-icons/react';
import React,{ useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────

type NavItem = 'keyboard-shortcuts' | 'slash-commands' | 'release-notes' | 'terms-of-service';

interface Release {
  version: string;
  date: string;
  changes: string[];
}

// ── Data ───────────────────────────────────────────────────────────────────

const RELEASES: Release[] = [
  {
    version: '0.0.1',
    date: 'June 2, 2026',
    changes: [
      'Initial beta release of templ',
      'Basic document management and workspace layout options',
      'Glance page with activity logs and quick capture',
    ],
  },
];

const KEYBOARD_SHORTCUTS: { category: string; shortcuts: { key: string; desc: string }[] }[] = [
  {
    category: 'General',
    shortcuts: [
      { key: 'Ctrl + Alt + L', desc: 'Toggle left sidebar' },
      { key: 'Ctrl + Alt + R', desc: 'Toggle right sidebar' },
      { key: 'Ctrl + Alt + ;', desc: 'Toggle top navbar' },
      { key: 'Ctrl + Alt + B', desc: 'Toggle minimized AI chat' },
    ],
  },
  {
    category: 'Navigation',
    shortcuts: [
      { key: 'Ctrl + Alt + ← / →', desc: 'Change tab item' },
      { key: 'Ctrl + Alt + H / J', desc: 'Change pane' },
      { key: 'Ctrl + Alt + N', desc: 'Split pane' },
      { key: 'Ctrl + Alt + Q', desc: 'Close active pane' },
      { key: 'Ctrl + K', desc: 'Document search' },
    ],
  },
];

const SLASH_COMMANDS_HELP: { category: string; commands: { title: string; trigger: string; desc: string; keywords: string }[] }[] = [
  {
    category: 'Basic Blocks',
    commands: [
      { title: 'Text', trigger: '/text', desc: 'Plain paragraph text', keywords: 'text, paragraph, p, plain' },
      { title: 'Heading 1', trigger: '/h1', desc: 'Large section heading', keywords: 'h1, heading, title, heading1' },
      { title: 'Heading 2', trigger: '/h2', desc: 'Medium section heading', keywords: 'h2, heading, heading2' },
      { title: 'Heading 3', trigger: '/h3', desc: 'Small section heading', keywords: 'h3, heading, heading3' },
      { title: 'Quote', trigger: '/quote', desc: 'Capture a quote block', keywords: 'quote, blockquote' },
      { title: 'Code block', trigger: '/code', desc: 'Syntax-highlighted code block', keywords: 'code, pre, codeblock, snippet' },
      { title: 'Divider', trigger: '/divider', desc: 'Horizontal line divider', keywords: 'divider, hr, rule, separator' },
      { title: 'Callout', trigger: '/callout', desc: 'A colored highlight or warning box', keywords: 'callout, info, highlight, box, note, alert, warning' },
      { title: 'Toggle', trigger: '/toggle', desc: 'Collapsible details section', keywords: 'toggle, collapse, expand, accordion' },
      { title: 'Table', trigger: '/table', desc: 'Insert a simple 3x3 table', keywords: 'table, grid, rows, columns' },
    ],
  },
  {
    category: 'Lists',
    commands: [
      { title: 'Bullet List', trigger: '/bullet', desc: 'An unordered bullet list', keywords: 'bullet, list, ul, unordered' },
      { title: 'Numbered List', trigger: '/numbered', desc: 'An ordered numbered list', keywords: 'numbered, list, ol, ordered, number' },
      { title: 'To-do List', trigger: '/todo', desc: 'Task checklist with checkboxes', keywords: 'todo, checklist, task, checkbox' },
      { title: 'Toggle List', trigger: '/toggle list', desc: 'Collapsible list items', keywords: 'toggle list, collapsible, expandable' },
    ],
  },
  {
    category: 'Layout',
    commands: [
      { title: '2 Columns', trigger: '/2 columns', desc: 'Split layout into 2 side-by-side columns', keywords: '2 columns, split, layout, col' },
      { title: '3 Columns', trigger: '/3 columns', desc: 'Split layout into 3 side-by-side columns', keywords: '3 columns, split, layout, col' },
      { title: '4 Columns', trigger: '/4 columns', desc: 'Split layout into 4 side-by-side columns', keywords: '4 columns, split, layout, col' },
      { title: '5 Columns', trigger: '/5 columns', desc: 'Split layout into 5 side-by-side columns', keywords: '5 columns, split, layout, col' },
    ],
  },
  {
    category: 'Media',
    commands: [
      { title: 'Image', trigger: '/image', desc: 'Upload or embed a photo/picture', keywords: 'image, photo, picture, upload, img' },
      { title: 'Video', trigger: '/video', desc: 'Embed a video by URL (YouTube, MP4, etc.)', keywords: 'video, youtube, embed, mp4' },
    ],
  },
  {
    category: 'Advanced',
    commands: [
      { title: 'Math Equation', trigger: '/math', desc: 'LaTeX block equation', keywords: 'math, equation, latex, formula, katex' },
    ],
  },
];

const TERMS = `Last updated: May 2026

1. Acceptance of Terms
By accessing or using templ, you agree to be bound by these Terms of Service. If you do not agree to all the terms, please do not use the application.

2. Use of the Service
templ is a personal productivity and note-taking application. You may use the service for lawful purposes only. You agree not to misuse the application or help anyone else do so.

3. Your Content
You retain ownership of any notes, documents, and data you create within templ. We do not claim any intellectual property rights over your content. Your data is stored locally and/or synced as per your chosen settings.

4. Privacy
We are committed to protecting your privacy. templ processes your data locally by default. Any cloud sync features are opt-in and governed by our Privacy Policy.

5. Modifications
We may update or modify the application at any time. We will provide reasonable notice of significant changes via in-app release notes.

6. Disclaimer of Warranties
The service is provided "as is" without warranties of any kind, either express or implied. We do not warrant that the service will be error-free or uninterrupted.

7. Limitation of Liability
To the fullest extent permitted by law, templ and its developers shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service.

8. Termination
We reserve the right to suspend or terminate your access to the service at our discretion, without notice, for conduct that we believe violates these Terms of Service.

9. Governing Law
These terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles.

10. Contact
If you have any questions about these Terms of Service, please reach out via the official templ support channels.`;

// ── Sub-components ─────────────────────────────────────────────────────────

function KeyboardShortcuts() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight mb-1">Keyboard Shortcuts</h2>
        <p className="text-sm text-muted-foreground">Boost your productivity with these handy shortcuts.</p>
      </div>
      {KEYBOARD_SHORTCUTS.map((section) => (
        <div key={section.category} className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-teal-500 dark:text-teal-400 mb-1">
            {section.category}
          </h3>
          <div className="rounded-xl border border-border/50 overflow-hidden">
            {section.shortcuts.map((s, i) => (
              <div
                key={s.key}
                className={`flex items-center justify-between px-4 py-2.5 ${
                  i !== 0 ? 'border-t border-border/30' : ''
                } hover:bg-muted/30 transition-colors`}
              >
                <span className="text-sm text-foreground/80">{s.desc}</span>
                <kbd className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted border border-border/60 text-[11px] font-mono text-muted-foreground shadow-sm">
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SlashCommandsHelp() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight mb-1">Slash Commands</h2>
        <p className="text-sm text-muted-foreground">
          Type <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border/60 text-xs font-mono font-bold text-teal-500 dark:text-teal-400">/</kbd> on a new line in the editor to insert block elements.
        </p>
      </div>
      {SLASH_COMMANDS_HELP.map((section) => (
        <div key={section.category} className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-teal-500 dark:text-teal-400 mb-1">
            {section.category}
          </h3>
          <div className="rounded-xl border border-border/50 overflow-hidden">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-muted/30 border-b border-border/50 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 w-1/4">Command</th>
                  <th className="px-4 py-3 w-1/4">Trigger</th>
                  <th className="px-4 py-3 w-1/2">Description</th>
                </tr>
              </thead>
              <tbody>
                {section.commands.map((cmd, i) => (
                  <tr
                    key={cmd.title}
                    className={`hover:bg-muted/30 transition-colors ${
                      i !== 0 ? 'border-t border-border/30' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-foreground">{cmd.title}</td>
                    <td className="px-4 py-3">
                      <kbd className="px-2 py-0.5 rounded-md bg-muted border border-border/60 text-[11px] font-mono text-teal-600 dark:text-teal-400 font-bold shadow-sm">
                        {cmd.trigger}
                      </kbd>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{cmd.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

function ReleaseNotes({ selectedRelease, onSelectRelease }: { selectedRelease: string; onSelectRelease: (v: string) => void }) {
  const release = RELEASES.find((r) => r.version === selectedRelease) || RELEASES[0];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight mb-1">Release Notes</h2>
        <p className="text-sm text-muted-foreground">What's new in each version of templ.</p>
      </div>

      {/* Version dropdown */}
      <div className="relative w-48">
        <select
          value={selectedRelease}
          onChange={(e) => onSelectRelease(e.target.value)}
          className="w-full appearance-none bg-muted/50 border border-border/60 rounded-lg px-3 py-2 pr-8 text-sm text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500/60 transition-all"
        >
          {RELEASES.map((r) => (
            <option key={r.version} value={r.version}>
              v{r.version} — {r.date}
            </option>
          ))}
        </select>
        <CaretDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      </div>

      {/* Release card */}
      <div className="rounded-xl border border-border/50 bg-muted/20 p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-foreground">v{release.version}</span>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{release.date}</span>
        </div>
        <div className="h-px bg-border/25" />
        <ul className="flex flex-col gap-2">
          {release.changes.map((change, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/80">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0" />
              {change}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function TermsOfService() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight mb-1">Terms of Service</h2>
        <p className="text-sm text-muted-foreground">Please read these terms carefully before using templ.</p>
      </div>
      <div className="rounded-xl border border-border/50 bg-muted/20 p-6">
        {TERMS.split('\n\n').map((para, i) => {
          const isHeading = /^\d+\./.test(para);
          return (
            <div key={i} className={isHeading ? 'mt-5 first:mt-0' : 'mt-2'}>
              {isHeading ? (
                <h3 className="text-sm font-semibold text-foreground mb-1">{para}</h3>
              ) : (
                <p className="text-sm text-foreground/70 leading-relaxed">{para}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

const NAV_ITEMS: { id: NavItem; label: string; icon: React.ReactNode }[] = [
  { id: 'keyboard-shortcuts', label: 'Keyboard Shortcuts', icon: <Keyboard size={15} /> },
  { id: 'slash-commands', label: 'Slash Commands', icon: <Command size={15} /> },
  { id: 'release-notes', label: 'Release Notes', icon: <Tag size={15} /> },
  { id: 'terms-of-service', label: 'Terms of Service', icon: <FileText size={15} /> },
];

const APP_VERSION = '0.0.1';

export const HelpPage: React.FC = () => {
  const [activeNav, setActiveNav] = useState<NavItem>('keyboard-shortcuts');
  const [selectedRelease, setSelectedRelease] = useState(RELEASES[0].version);

  return (
    <div className="h-full w-full flex overflow-hidden bg-background font-sans text-foreground select-none">
      {/* ── LEFT SIDEBAR ──────────────────────────────────────────── */}
      <div className="w-60 flex-shrink-0 border-r border-border/50 flex flex-col py-6 px-3">
        <div className="px-2 mb-4">
          <h1 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Help &amp; Info</h1>
        </div>

        <nav className="flex flex-col gap-0.5 flex-1">
          {NAV_ITEMS.map((item) => {
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-teal-500/10 dark:bg-teal-500/15 text-teal-600 dark:text-teal-400 font-medium border border-teal-500/30 dark:border-teal-500/20'
                    : 'text-foreground/70 hover:bg-muted/50 hover:text-foreground border border-transparent'
                }`}
              >
                <span className={isActive ? 'text-teal-500' : 'text-muted-foreground'}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── CENTER CONTENT ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="max-w-2xl mx-auto px-10 py-10">
          {activeNav === 'keyboard-shortcuts' && <KeyboardShortcuts />}
          {activeNav === 'slash-commands' && <SlashCommandsHelp />}
          {activeNav === 'release-notes' && (
            <ReleaseNotes selectedRelease={selectedRelease} onSelectRelease={setSelectedRelease} />
          )}
          {activeNav === 'terms-of-service' && <TermsOfService />}
        </div>
      </div>
    </div>
  );
};
