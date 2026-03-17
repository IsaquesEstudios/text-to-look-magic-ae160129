import React from "react";
import discoveryLogo from "@/assets/discovery-logo.png";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

const HYDRATION_RETRY_KEY = "hydration-dom-retry";
const HYDRATION_RETRY_WINDOW_MS = 10_000;

function isRecoverableHydrationError(error: Error) {
  const msg = error?.message || "";

  return (
    msg.includes("insertBefore") ||
    msg.includes("removeChild") ||
    msg.includes("appendChild") ||
    msg.includes("not a child of this node") ||
    msg.includes("Hydration failed") ||
    msg.includes("hydrating")
  );
}

export class HydrationErrorBoundary extends React.Component<Props, State> {
  private retryTimeout: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State | null {
    if (isRecoverableHydrationError(error)) {
      return { hasError: true };
    }

    throw error;
  }

  componentDidCatch(error: Error) {
    if (!isRecoverableHydrationError(error)) {
      throw error;
    }

    console.warn("[HydrationErrorBoundary] Recoverable hydration error:", error.message);

    if (typeof window === "undefined") {
      return;
    }

    const lastAttempt = Number(sessionStorage.getItem(HYDRATION_RETRY_KEY) || "0");
    const shouldReload = lastAttempt && Date.now() - lastAttempt < HYDRATION_RETRY_WINDOW_MS;

    if (shouldReload) {
      window.location.reload();
      return;
    }

    sessionStorage.setItem(HYDRATION_RETRY_KEY, String(Date.now()));
    this.retryTimeout = window.setTimeout(() => this.setState({ hasError: false }), 0);
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      window.clearTimeout(this.retryTimeout);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background">
          <img src={discoveryLogo} alt="Discovery" className="h-12 mb-6" />
          <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      );
    }

    return this.props.children;
  }
}
