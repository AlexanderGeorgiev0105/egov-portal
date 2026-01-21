import { Link, useParams } from "react-router-dom";
import { categories, servicesByCategory } from "../../../data/mockData";

export default function ServicesByCategoryPage() {
  const { id } = useParams();
  const category = categories.find((c) => c.id === id);
  const services = servicesByCategory[id] || [];

  return (
    <div>
      <h1>Services in Category</h1>
      <p>
        <strong>Категория:</strong> {category ? category.name : id}
      </p>

      {services.length === 0 ? (
        <p>Няма услуги за тази категория.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "12px",
          }}
        >
          {services.map((s) => (
            <div key={s.id} className="card">
              <h3 style={{ marginTop: 0 }}>{s.title}</h3>
              <p style={{ color: "#555" }}>{s.description}</p>
              <Link to={`/user/services/${s.id}`}>Open →</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
