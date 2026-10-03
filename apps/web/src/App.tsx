import { useEffect, useState, type FormEvent } from "react";
import type { ApiResponse } from "@pms/api-client";
import type { Project } from "@pms/domain";

const apiBaseUrl = "http://localhost:3100";

type LoginResponse = {
  accessToken: string;
};

export default function App() {
  const [accessToken, setAccessToken] = useState("");
  const [login, setLogin] = useState("demo");
  const [password, setPassword] = useState("demo");
  const [notice, setNotice] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (accessToken === "") {
      return;
    }
    setLoading(true);
    fetch(`${apiBaseUrl}/api/projects?workspaceId=workspace-demo`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(async (response) => {
        if (!response.ok) {
          setNotice("项目加载失败。");
          setLoading(false);
          return;
        }
        const result = (await response.json()) as ApiResponse<Project[]>;
        setProjects(result.data);
        setLoading(false);
      });
  }, [accessToken]);

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, password }),
    });
    if (!response.ok) {
      setNotice("账号或密码错误。");
      return;
    }
    const result = (await response.json()) as LoginResponse;
    setAccessToken(result.accessToken);
    setNotice("");
  }

  if (accessToken === "") {
    return (
      <main className="web-login">
        <form className="login-card" onSubmit={submitLogin}>
          <span className="brand-mark">P</span>
          <p className="eyebrow">PROJECT MANAGEMENT SYSTEM</p>
          <h1>把团队工作放在同一条线上。</h1>
          <label>
            账号
            <input value={login} onChange={(event) => setLogin(event.target.value)} />
          </label>
          <label>
            密码
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {notice !== "" && <p className="error-text">{notice}</p>}
          <button type="submit">进入工作区</button>
          <small>演示账号：demo / demo</small>
        </form>
      </main>
    );
  }

  return (
    <main className="web-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">PMS WORKSPACE</p>
          <h1>项目总览</h1>
        </div>
        <button
          className="quiet-button"
          onClick={() => setAccessToken("")}
          type="button"
        >
          退出登录
        </button>
      </header>
      <section className="summary-row">
        <div>
          <strong>{projects.length}</strong>
          <span>个项目</span>
        </div>
        <div>
          <strong>实时</strong>
          <span>云端数据</span>
        </div>
        <div>
          <strong>AI</strong>
          <span>审批式协作</span>
        </div>
      </section>
      <section className="project-grid">
        {loading && <p className="muted-text">正在加载项目…</p>}
        {!loading &&
          projects.map((project) => (
            <article className="project-card" key={project.id}>
              <div className="project-dot" />
              <p className="eyebrow">{project.status}</p>
              <h2>{project.name}</h2>
              <p>{project.description}</p>
              <footer>
                <span>负责人 {project.ownerId}</span>
                <span>{project.targetDate}</span>
              </footer>
            </article>
          ))}
      </section>
    </main>
  );
}
