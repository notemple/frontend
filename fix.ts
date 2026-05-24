import { Project } from 'ts-morph';

const project = new Project({
    tsConfigFilePath: 'tsconfig.app.json',
});

const diagnostics = project.getPreEmitDiagnostics();
console.log(`Found ${diagnostics.length} diagnostics`);

for (const diagnostic of diagnostics) {
    const file = diagnostic.getSourceFile();
    if (!file) continue;
    
    const code = diagnostic.getCode();
    const start = diagnostic.getStart();
    const length = diagnostic.getLength();
    
    if (start === undefined || length === undefined) continue;

    // TS6133: '* is declared but its value is never read.'
    if (code === 6133) {
        // We could just comment it out, but it might be in a destruction
        // It's easier to let the developer fix it or just prepend `// @ts-ignore`
    }
}

// Actually, ts-morph can automatically fix missing types by using the language service.
const formatDiagnostics = project.getLanguageService().getFormattedDiagnostics(diagnostics);
console.log(formatDiagnostics);
