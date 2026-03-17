

## Diagnosis

The error **"Falha ao executar 'insertBefore' em 'Node'"** (Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node) is a **DOM hydration mismatch** error. This happens when:

1. The app uses **SSG (vite-react-ssg)** which pre-renders HTML on the server
2. When React tries to **hydrate** the pre-rendered HTML in the browser, the DOM has been modified by something external (browser extensions, translation tools, ad blockers, etc.)
3. React expects the DOM to match its virtual DOM exactly, and when it doesn't, this error occurs

This is especially common on **mobile browsers** (like the user's Android Chrome) where:
- Google Translate auto-translates the page, modifying DOM nodes
- Browser extensions inject elements
- Font/accessibility features modify text nodes

## Root Cause

The project uses `ViteReactSSG` for static site generation. The SSG pre-renders pages as HTML, and React hydrates them on the client. If any browser feature (especially Google Translate or similar) modifies the DOM between the HTML load and React hydration, this crash occurs.

## Plan

1. **Add `translate="no"` attribute to the root HTML element** in `index.html` to prevent Google Translate from modifying the DOM before hydration (the app already has its own i18n system)

2. **Wrap the app in a React Error Boundary** that catches this specific DOM error gracefully and forces a full client-side re-render instead of showing a crash screen. This way even if some extension modifies the DOM, the user gets a working page instead of an error.

3. **Add `suppressHydrationWarnings`** on the root element to make React more tolerant of minor DOM mismatches.

### Files to modify:
- `index.html` -- add `translate="no"` to `<html>` tag
- `src/App.tsx` or create `src/components/ErrorBoundary.tsx` -- add error boundary that catches DOM errors and retries rendering
- `src/routes.tsx` -- wrap root layout with the error boundary

