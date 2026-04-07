import React from "react";
import { AlertTriangle } from "lucide-react";
import { ButtonPill, Panel } from "./ui";

export class SectionErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: "",
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || "Esta sección tuvo un problema al renderizar.",
    };
  }

  componentDidUpdate(previousProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({
        hasError: false,
        errorMessage: "",
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <Panel className="p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 p-3 text-rose-100">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="font-display text-2xl text-stone-100">No pude abrir esta sección</h2>
              <p className="mt-2 text-sm leading-relaxed text-stone-400">
                {this.state.errorMessage}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <ButtonPill
                  onClick={() =>
                    this.setState({
                      hasError: false,
                      errorMessage: "",
                    })
                  }
                >
                  Reintentar
                </ButtonPill>
                {this.props.onFallback ? (
                  <ButtonPill onClick={this.props.onFallback}>Volver al resumen</ButtonPill>
                ) : null}
              </div>
            </div>
          </div>
        </Panel>
      );
    }

    return this.props.children;
  }
}
