import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, Link, createRootRouteWithContext, useRouter, HeadContent, Scripts, type ErrorComponentProps } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold text-zinc-100">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-zinc-100">Página no encontrada</h2>
        <p className="mt-2 text-sm text-zinc-400">Esta ruta no existe en Trivia Master MX.</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error: caughtError, reset }: ErrorComponentProps) {
  const error = caughtError instanceof Error ? caughtError : new Error(String(caughtError));
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-zinc-100">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Algo salió mal</h1>
        <p className="mt-2 text-sm text-zinc-400">{error.message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Reintentar
          </button>
          <a href="/" className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium">
            Inicio
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#09090b" },
      { title: "TriviaMX — Panel del Moderador" },
      {
        name: "description",
        content:
          "Web App mobile-first en español para moderadores de trivia: banco de preguntas, cronómetro, respuestas ocultas y generación de preguntas con IA.",
      },
      { property: "og:title", content: "Trivia Master MX — Panel del Moderador" },
      {
        property: "og:description",
        content:
          "Web App mobile-first en español para moderadores de trivia: banco de preguntas, cronómetro, respuestas ocultas y generación de preguntas con IA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Trivia Master MX — Panel del Moderador" },
      {
        name: "twitter:description",
        content:
          "Web App mobile-first en español para moderadores de trivia: banco de preguntas, cronómetro, respuestas ocultas y generación de preguntas con IA.",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/7dcd8ca5-3c77-4caf-88b0-a40a61a12ec6/id-preview-ef654b95--edc44288-a0ba-40cd-831e-2d9e181fab9f.lovable.app-1784597226826.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/7dcd8ca5-3c77-4caf-88b0-a40a61a12ec6/id-preview-ef654b95--edc44288-a0ba-40cd-831e-2d9e181fab9f.lovable.app-1784597226826.png",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="es-MX">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
