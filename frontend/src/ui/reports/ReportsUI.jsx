import "../../styles/reports-ui.css";

export function ReportsShell({ children }) {
  return <div className="rp-page">{children}</div>;
}

/* Минимални UI wrappers (не променят layout-а), само дават еднакви класове */
export function Card({ className = "", style, children, ...rest }) {
  return (
    <div className={`card ${className}`.trim()} style={style} {...rest}>
      {children}
    </div>
  );
}

export function Btn({ className = "", variant, style, children, ...rest }) {
  const v = variant === "primary" ? "btn btn-primary" : "btn";
  return (
    <button className={`${v} ${className}`.trim()} style={style} {...rest}>
      {children}
    </button>
  );
}

export function Badge({ className = "", style, children, ...rest }) {
  return (
    <span className={`badge ${className}`.trim()} style={style} {...rest}>
      {children}
    </span>
  );
}
