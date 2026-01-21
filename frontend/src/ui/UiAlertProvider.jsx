import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import "../styles/ui-alert.css";

const UiAlertContext = createContext(null);

export function UiAlertProvider({ children }) {
  const [state, setState] = useState({
    open: false,
    title: "Съобщение",
    message: "",
  });

  const resolverRef = useRef(null);

  const showAlert = useCallback((message, opts = {}) => {
    const title = opts.title ?? "Съобщение";

    setState({
      open: true,
      title,
      message: String(message ?? ""),
    });

    return new Promise((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const close = useCallback(() => {
    setState((s) => ({ ...s, open: false }));
    if (resolverRef.current) {
      resolverRef.current();
      resolverRef.current = null;
    }
  }, []);

  return (
    <UiAlertContext.Provider value={{ showAlert }}>
      {children}

      {state.open && (
        <div className="ui-overlay" onClick={close}>
          <div className="ui-modal ui-modal--sm ui-card" onClick={(e) => e.stopPropagation()}>
            <div className="ui-modalHead">
              <div className="ui-modalTitle">{state.title}</div>
              <button className="ui-btn" onClick={close} title="Затвори">
                ✕
              </button>
            </div>

            <div className="ui-modalBody">
              <div className="ui-modalMsg">{state.message}</div>

              <div className="ui-modalActions">
                <button className="ui-btn ui-btn--primary" onClick={close}>
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </UiAlertContext.Provider>
  );
}

export function useUiAlert() {
  const ctx = useContext(UiAlertContext);
  if (!ctx) throw new Error("useUiAlert must be used inside <UiAlertProvider />");
  return ctx;
}
