# ProtoAI

AI-powered HTML prototype generator — describe your idea, get working HTML prototypes in seconds.

## Features

- **AI-Powered Generation**: Uses OpenAI / Claude / local models to generate HTML prototypes from text descriptions or uploaded documents
- **Multi-Page Support**: Automatically plans and splits complex projects into multiple pages with consistent styling
- **Two-Phase Workflow**: Plan first, review the structure, then generate — no wasted API calls
- **Real-Time Preview**: Live iframe preview with desktop / tablet / mobile viewport switching
- **Style Consistency**: Shared design tokens ensure visual coherence across all generated pages
- **Code Refinement**: Built-in Monaco code editor and chat-based AI refinement
- **Export Options**: Export as HTML, ZIP (multi-page), or PNG images
- **Version History**: Persistent generation history with restore and export capabilities
- **Dark Mode**: Full light/dark theme support

## Tech Stack

- React 18 + Vite 5
- Lucide React (icons)
- JSZip (ZIP export)
- CSS Custom Properties (design token system)

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## Usage

1. Enter a content description or upload requirement documents
2. Select style preferences (business, minimal, creative, etc.)
3. Configure your AI model (OpenAI, Claude, or custom endpoint)
4. Click "Plan" to preview the page structure
5. Confirm and watch pages generate one by one with live previews
6. Refine via chat or direct code editing
7. Export as HTML, ZIP, or images

## License

MIT
