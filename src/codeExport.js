/**
 * Code export utilities — convert HTML prototypes to React JSX or Tailwind HTML.
 */

/**
 * Convert an HTML prototype page to a React functional component (JSX).
 * Wraps the HTML in a basic React component structure with inline styles extracted.
 */
export function htmlToReactComponent(html, componentName = 'ProtoPage') {
  // Extract the body content
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1].trim() : html;

  // Extract <style> content
  const styleMatches = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)];
  const cssContent = styleMatches.map(m => m[1].trim()).join('\n\n');

  // Convert HTML attributes to JSX-compatible format
  let jsxContent = bodyContent
    // class -> className
    .replace(/\bclass=/g, 'className=')
    // for -> htmlFor
    .replace(/\bfor=/g, 'htmlFor=')
    // Self-closing tags: <br> -> <br />, <img ...> -> <img ... />, <hr> -> <hr />, <input ...> -> <input ... />
    .replace(/<(br|hr|img|input|link|meta)(\s[^>]*)?>/gi, (match, tag, attrs) => {
      if (match.endsWith('/>')) return match;
      return `<${tag}${attrs || ''} />`;
    })
    // style="..." string values stay as-is for dangerouslySetInnerHTML approach
    // Remove onclick/onmouseover inline handlers (not supported in React)
    .replace(/\s+on\w+="[^"]*"/gi, '')
    // tabindex -> tabIndex
    .replace(/\btabindex=/g, 'tabIndex=')
    // readonly -> readOnly
    .replace(/\breadonly\b/g, 'readOnly')
    // Fix double quotes inside JSX attributes (basic)
    ;

  // Build the React component
  const component = `import React from 'react';

${cssContent ? `const styles = \`
${cssContent}
\`;` : ''}

export default function ${componentName}() {
  return (
    <div className="${componentName.toLowerCase()}-container">
      ${cssContent ? `<style>{styles}</style>` : ''}
      <div dangerouslySetInnerHTML={{ __html: \`${jsxContent.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\` }} />
    </div>
  );
}
`;

  return component;
}

/**
 * Convert inline styles in HTML to Tailwind CSS utility classes.
 * This is a best-effort conversion for common patterns.
 */
export function htmlToTailwind(html) {
  let result = html;

  // Common inline style to Tailwind mappings
  const styleMappings = {
    // Display & Layout
    'display: flex': 'flex',
    'display: grid': 'grid',
    'display: block': 'block',
    'display: inline-flex': 'inline-flex',
    'display: inline-block': 'inline-block',
    'display: none': 'hidden',
    'flex-direction: column': 'flex-col',
    'flex-direction: row': 'flex-row',
    'flex-wrap: wrap': 'flex-wrap',
    'align-items: center': 'items-center',
    'align-items: flex-start': 'items-start',
    'align-items: flex-end': 'items-end',
    'justify-content: center': 'justify-center',
    'justify-content: space-between': 'justify-between',
    'justify-content: flex-start': 'justify-start',
    'justify-content: flex-end': 'justify-end',

    // Position
    'position: fixed': 'fixed',
    'position: absolute': 'absolute',
    'position: relative': 'relative',
    'position: sticky': 'sticky',

    // Spacing (common values)
    'padding: 8px': 'p-2',
    'padding: 12px': 'p-3',
    'padding: 16px': 'p-4',
    'padding: 20px': 'p-5',
    'padding: 24px': 'p-6',
    'padding: 32px': 'p-8',
    'padding: 48px': 'p-12',
    'margin: 0 auto': 'mx-auto',
    'margin-bottom: 8px': 'mb-2',
    'margin-bottom: 16px': 'mb-4',
    'margin-bottom: 24px': 'mb-6',
    'margin-bottom: 32px': 'mb-8',

    // Sizing
    'width: 100%': 'w-full',
    'height: 100%': 'h-full',
    'max-width: 1200px': 'max-w-7xl',
    'max-width: 768px': 'max-w-3xl',
    'max-width: 640px': 'max-w-2xl',
    'min-height: 100vh': 'min-h-screen',

    // Typography
    'font-weight: 700': 'font-bold',
    'font-weight: 600': 'font-semibold',
    'font-weight: 500': 'font-medium',
    'font-weight: 400': 'font-normal',
    'text-align: center': 'text-center',
    'text-align: left': 'text-left',
    'text-align: right': 'text-right',
    'text-decoration: none': 'no-underline',
    'white-space: nowrap': 'whitespace-nowrap',
    'text-overflow: ellipsis': 'truncate',
    'overflow: hidden': 'overflow-hidden',

    // Border & Radius
    'border-radius: 4px': 'rounded',
    'border-radius: 8px': 'rounded-lg',
    'border-radius: 12px': 'rounded-xl',
    'border-radius: 16px': 'rounded-2xl',
    'border-radius: 9999px': 'rounded-full',
    'border-radius: 50%': 'rounded-full',

    // Colors (common)
    'color: #ffffff': 'text-white',
    'color: #000000': 'text-black',
    'color: #111': 'text-gray-900',
    'color: #333': 'text-gray-700',
    'color: #555': 'text-gray-600',
    'color: #666': 'text-gray-500',
    'color: #888': 'text-gray-400',
    'background: #ffffff': 'bg-white',
    'background-color: #ffffff': 'bg-white',
    'background: #000000': 'bg-black',
    'background-color: #000000': 'bg-black',

    // Misc
    'cursor: pointer': 'cursor-pointer',
    'overflow: auto': 'overflow-auto',
    'overflow: scroll': 'overflow-scroll',
    'z-index: 99999': 'z-50',
    'z-index: 10': 'z-10',
    'opacity: 0.5': 'opacity-50',
    'transition: all': 'transition-all',
  };

  // Process style attributes and convert to Tailwind classes
  result = result.replace(/style="([^"]*)"/g, (match, styleStr) => {
    const tailwindClasses = [];
    const remainingStyles = [];

    // Split style string into individual declarations
    const declarations = styleStr.split(';').map(s => s.trim()).filter(Boolean);

    for (const decl of declarations) {
      const normalized = decl.replace(/\s+/g, ' ').trim();
      if (styleMappings[normalized]) {
        tailwindClasses.push(styleMappings[normalized]);
      } else {
        remainingStyles.push(decl);
      }
    }

    if (tailwindClasses.length === 0) return match; // no conversion possible

    // Find the parent element to add class attribute
    const classes = tailwindClasses.join(' ');
    if (remainingStyles.length === 0) {
      return `data-tw="${classes}"`;
    }
    return `data-tw="${classes}" style="${remainingStyles.join('; ')}"`;
  });

  // Convert data-tw to actual class attributes (merging with existing classes)
  result = result.replace(/(<\w+)([^>]*?)\s*data-tw="([^"]*)"([^>]*?)>/g, (match, tag, before, twClasses, after) => {
    const classMatch = (before + after).match(/\s*class="([^"]*)"/);
    if (classMatch) {
      const existingClasses = classMatch[1];
      const merged = `${existingClasses} ${twClasses}`.trim();
      const cleaned = (before + after).replace(/\s*class="[^"]*"/, ` class="${merged}"`);
      return `${tag}${cleaned}>`;
    }
    return `${tag} class="${twClasses}"${before}${after}>`;
  });

  // Add Tailwind CDN script if not present
  if (!result.includes('tailwindcss')) {
    const tailwindCdn = '<script src="https://cdn.tailwindcss.com"></script>';
    if (result.includes('</head>')) {
      result = result.replace('</head>', `  ${tailwindCdn}\n</head>`);
    } else if (result.includes('<body')) {
      result = result.replace('<body', `${tailwindCdn}\n<body`);
    }
  }

  return result;
}

/**
 * Generate a clean, production-ready HTML file with proper meta tags.
 */
export function htmlToCleanHtml(html, title = 'ProtoAI Prototype') {
  // Remove ProtoAI navigation bar if present
  let clean = html.replace(/<nav[^>]*style="position:fixed;top:0[^"]*"[^>]*>[\s\S]*?<\/nav>/g, '');
  clean = clean.replace(/<div[^>]*style="height:52px;"[^>]*><\/div>/g, '');

  // Ensure proper title
  if (clean.includes('<title>')) {
    clean = clean.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
  } else if (clean.includes('</head>')) {
    clean = clean.replace('</head>', `  <title>${title}</title>\n</head>`);
  }

  return clean;
}
