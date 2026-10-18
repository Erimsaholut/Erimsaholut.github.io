import { Component, type ReactNode } from "react";

/** Renders the fallback if a WebGL scene throws (old GPU, context lost, etc.). */
export default class SafeBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback ?? null : this.props.children;
  }
}
