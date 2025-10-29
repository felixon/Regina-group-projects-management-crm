# DomainDeck: Project & Domain Management CRM

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/felixon/Regina-group-projects-management-crm)

> A minimalist and visually stunning CRM for managing web projects with a powerful, integrated domain expiry tracking system.

DomainDeck is a visually stunning, minimalist web application designed to be a comprehensive Project Management CRM with a specialized focus on domain lifecycle tracking. It replaces traditional spreadsheets with an intuitive, interactive dashboard. The entire experience is built to be fast, responsive, and aesthetically pleasing, running on Cloudflare's edge network for global performance.

## Key Features

*   **Full Project Management**: Perform full CRUD (Create, Read, Update, Delete) operations on your web projects.
*   **Interactive Dashboard**: View all projects in a clean, sortable, and filterable data table.
*   **Domain Expiry Tracking**: Visually flags domains approaching their expiration date to prevent accidental loss.
*   **Collaboration**: A commenting feature for each project allows for team collaboration and note-taking.
*   **Modern UI/UX**: A beautiful, minimalist interface built with shadcn/ui and Tailwind CSS, featuring a slide-in panel for editing and details.
*   **Responsive Design**: Flawless experience across all device sizes, from mobile to desktop.

## Tech Stack

*   **Frontend**: React, Vite, TypeScript, Tailwind CSS
*   **UI Components**: shadcn/ui, Radix UI, Lucide React
*   **State Management**: Zustand
*   **Forms**: React Hook Form with Zod for validation
*   **Animations**: Framer Motion
*   **Backend**: Hono on Cloudflare Workers
*   **Storage**: Cloudflare Durable Objects

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

*   [Bun](https://bun.sh/) installed on your machine.
*   A [Cloudflare account](https://dash.cloudflare.com/sign-up).
*   [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed and authenticated.

```bash
bun install -g wrangler
wrangler login
```

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/domaindeck_crm.git
    cd domaindeck_crm
    ```

2.  **Install dependencies:**
    This project uses Bun for package management.
    ```bash
    bun install
    ```

3.  **Run the development server:**
    This command starts the Vite frontend server and the Wrangler dev server for the backend worker simultaneously.
    ```bash
    bun dev
    ```
    The application will be available at `http://localhost:3000`.

## Development

The project is organized into three main directories:

*   `src/`: Contains the React frontend application code.
    *   `pages/`: Main pages/views of the application.
    *   `components/`: Reusable React components, including shadcn/ui components.
    *   `lib/`: Utility functions and API client.
    *   `hooks/`: Custom React hooks.
*   `worker/`: Contains the Hono backend code running on Cloudflare Workers.
    *   `index.ts`: The entry point for the worker.
    *   `user-routes.ts`: Where API routes are defined.
    *   `entities.ts`: Business logic and data models for Durable Objects.
*   `shared/`: Contains TypeScript types shared between the frontend and backend.

### Frontend

The frontend is a standard Vite + React application. Components are built using `shadcn/ui` and styled with Tailwind CSS. Global state is managed with Zustand.

### Backend

The backend is built with Hono, a lightweight web framework for edge environments. All data is persisted in a single `GlobalDurableObject` instance, abstracted through an entity-based system found in `worker/core-utils.ts` and `worker/entities.ts`. When adding new API endpoints, modify `worker/user-routes.ts`.

## Deployment

Deploying the application to Cloudflare is a one-step process.

1.  **Build and Deploy:**
    The `deploy` script in `package.json` handles building the frontend and deploying the worker.
    ```bash
    bun run deploy
    ```
    Wrangler will deploy your application, and you will receive a URL for your live site.

2.  **Deploy with the button:**

    [![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/felixon/Regina-group-projects-management-crm)