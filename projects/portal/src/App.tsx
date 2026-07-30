import tools from "../../../catalog/tools.json";

const statusLabels: Record<string, string> = {
  development: "준비 중",
  published: "공개",
};

export default function App() {
  return (
    <main className="portal">
      <header className="hero">
        <p className="eyebrow">ODD TOOLS · 이름 미정</p>
        <h1>이상한데,<br />조금 쓸모 있습니다.</h1>
        <p className="intro">
          잠깐씩 해볼 수 있는 이상하고 유용한 웹 도구를 만드는 중입니다.
        </p>
      </header>

      <section aria-labelledby="tools-heading">
        <div className="section-heading">
          <h2 id="tools-heading">첫 번째 도구</h2>
          <span>{tools.length} project</span>
        </div>

        <div className="tool-grid">
          {tools.map((tool) => (
            <a className="tool-card" href={tool.href} key={tool.id}>
              <span className="tool-status">
                {statusLabels[tool.status] ?? tool.status}
              </span>
              <div>
                <h3>{tool.title}</h3>
                <p>{tool.description}</p>
              </div>
              <span aria-hidden="true" className="tool-arrow">↗</span>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
