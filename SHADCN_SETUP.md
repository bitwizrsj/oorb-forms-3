# Shadcn Setup Instructions

Your project now supports a **shadcn-like structure** with the following enhancements:
- **Path Aliases**: You can now use `@/` to import from the `src` directory (e.g., `import { Button } from "@/components/ui/button"`).
- **UI Components Folder**: Reusable, atomic components are stored in `src/components/ui`.

## How to properly initialize Shadcn CLI

If you want to use the full shadcn/ui library, follow these steps:

1. **Initialize Shadcn**:
   Run the following command in your terminal:
   ```bash
   npx shadcn-ui@latest init
   ```

2. **Configuration Choices**:
   During initialization, you will be asked several questions. Here are the recommended answers for your current project:
   - **Would you like to use TypeScript?** Yes
   - **Which style would you like to use?** Default
   - **Which color would you like to use as base color?** Slate
   - **Where is your global CSS file?** `src/index.css` (or wherever your main CSS is)
   - **Do you want to use CSS variables for colors?** Yes
   - **Where is your tailwind.config.js located?** `tailwind.config.js`
   - **Configure the import alias for components:** `@/components`
   - **Configure the import alias for utils:** `@/lib/utils`

3. **Why use `src/components/ui`?**
   - **Atomicity**: Primitive components (Buttons, Inputs, etc.) are kept separate from layout/feature-specific components.
   - **Reusability**: By keeping them in a standard `ui` folder, they are easily shared across the entire application.
   - **Maintainability**: Following this convention makes it easier for other developers (and AI assistants) to understand your project structure.

## Adding New Components
Once initialized, you can add components like this:
```bash
npx shadcn-ui@latest add button
```

This will automatically create the component in `src/components/ui/button.tsx`.
