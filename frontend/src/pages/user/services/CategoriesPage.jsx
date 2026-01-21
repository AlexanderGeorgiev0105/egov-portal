import { Link } from "react-router-dom";
import { categories } from "../../../data/mockData";

export default function CategoriesPage() {
  return (
    <div>
      <h1>Categories</h1>
      <p>Избери категория:</p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "12px",
        }}
      >
        {categories.map((c) => (
          <Link
            key={c.id}
            to={
              c.id === "property"
                ? "/user/property"
                : c.id === "documents"
                ? "/user/documents"
                : c.id === "health"
                ? "/user/health"
                : c.id === "reports"
                ? "/user/reports"
                : `/user/categories/${c.id}/services`
            }
            className="card"
            style={{ textDecoration: "none" }}
          >
            <h3 style={{ margin: 0 }}>{c.name}</h3>
            <p style={{ marginTop: 8, color: "#555" }}>Виж услуги →</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
