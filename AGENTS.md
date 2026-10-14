# Architecture rules
- Keep the application on React + Vite SPA; reuse the reference design system's presentation without importing its router because existing authentication and navigation must remain intact.
- Express shared visual roles in global CSS tokens and Tailwind configuration, keeping Radix/shadcn component contracts because existing accessible interactions depend on them.
- Store imported reference fonts through asset pointers and load them from a single presentation initializer because media should use the project's asset delivery flow.