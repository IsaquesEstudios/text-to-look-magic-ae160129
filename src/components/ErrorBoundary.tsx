import React from "react";
import discoveryLogo from "@/assets/discovery-logo.png";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class HydrationErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State | null {
    const msg = error?.message || "";
    const isDomError =
      msg.includes("insertBefore") ||
      msg.includes("removeChild") ||
      msg.includes("appendChild") ||
      msg.includes("not a child of this node") ||
      msg.includes("Hydration failed") ||
      msg.includes("hydrating");
    if (isDomError) {
      return { hasError: true };
    }
    throw error; // re-throw non-DOM errors
  }

  componentDidCatch(error: Error) {
    console.warn("[HydrationErrorBoundary] Caught DOM error, forcing re-render:", error.message);
  }

  componentDidUpdate(_: Props, prevState: State) {
    if (this.state.hasError && prevState.hasError) {
      // Already retried once, do a full page reload as last resort
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      // Reset and retry render
      setTimeout(() => this.setState({ hasError: false }), 0);
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
