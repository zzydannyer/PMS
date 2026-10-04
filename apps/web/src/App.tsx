import { useEffect, useState, type FormEvent } from "react";
import type { ApiResponse } from "@pms/api-client";
import type { Project, WorkItem } from "@pms/domain";

const apiBaseUrl = "http://localhost:3100";

type LoginResponse = {
  accessToken: string;
};

function ConnectedWebApp() {
  const [accessToken, setAccessToken] = useState(
    () => localStorage.getItem("pms_access_token") || "",
  );
  const [login, setLogin] = useState("demo");
  const [password, setPassword] = useState("demo");
  const [notice, setNotice] = useState("准备好开始今天的工作。");
  const [projects, setProjects] = useState<Project[]>([]);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedProject = projects.find((project) => project.id === selectedProjectId);

  useEffect(() => {
    if (accessToken === "") {
      return;
    }
    setLoading(true);
    fetch(`${apiBaseUrl}/api/projects?workspaceId=workspace-demo`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }).then(async (response) => {
      if (!response.ok) {
        setNotice("项目加载失败。");
        setLoading(false);
        return;
      }
      const result = (await response.json()) as ApiResponse<Project[]>;
      setProjects(result.data);
      setSelectedProjectId((current) => current || result.data[0].id);
      setLoading(false);
    });
  }, [accessToken]);

  useEffect(() => {
    if (accessToken === "" || selectedProjectId === "") {
      return;
    }
    fetch(
      `${apiBaseUrl}/api/work-items?workspaceId=workspace-demo&projectId=${selectedProjectId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    ).then(async (response) => {
      if (!response.ok) {
        setNotice("任务加载失败。");
        return;
      }
      const result = (await response.json()) as ApiResponse<WorkItem[]>;
      setWorkItems(result.data);
    });
  }, [accessToken, selectedProjectId]);

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, password }),
    });
    if (!response.ok) {
      setNotice("账号或密码错误，或服务端尚未启动。");
      return;
    }
    const result = (await response.json()) as LoginResponse;
    localStorage.setItem("pms_access_token", result.accessToken);
    setAccessToken(result.accessToken);
  }

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (taskTitle.trim() === "" || selectedProjectId === "") {
      setNotice("请选择项目并输入任务名称。");
      return;
    }
    const response = await fetch(`${apiBaseUrl}/api/work-items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        workspaceId: "workspace-demo",
        projectId: selectedProjectId,
        title: taskTitle.trim(),
        description: "",
        type: "TASK",
        priority: "MEDIUM",
        reporterId: "member-demo",
      }),
    });
    if (!response.ok) {
      setNotice("任务创建失败。");
      return;
    }
    const result = (await response.json()) as ApiResponse<WorkItem>;
    setWorkItems((items) => [result.data, ...items]);
    setTaskTitle("");
    setNotice(`“${result.data.title}”已创建。`);
  }

  async function completeTask(item: WorkItem) {
    const response = await fetch(`${apiBaseUrl}/api/work-items/${item.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        status: "DONE",
        priority: item.priority,
        assigneeId: item.assigneeId,
        dueDate: item.dueDate,
      }),
    });
    if (!response.ok) {
      setNotice("任务状态更新失败。");
      return;
    }
    const result = (await response.json()) as ApiResponse<WorkItem>;
    setWorkItems((items) =>
      items.map((current) => (current.id === result.data.id ? result.data : current)),
    );
    setNotice("任务已完成。");
  }

  if (accessToken === "") {
    return (
      <main className="web-login">
        <form className="login-card" onSubmit={submitLogin}>
          <span className="brand-mark">P</span>
          <p className="eyebrow">PMS WORKSPACE</p>
          <h1>把团队工作放在同一条线上。</h1>
          <label>账号<input value={login} onChange={(event) => setLogin(event.target.value)} /></label>
          <label>密码<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
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
        <div><p className="eyebrow">PMS WORKSPACE</p><h1>项目工作台</h1><p>{notice}</p></div>
        <button className="quiet-button" type="button" onClick={() => { localStorage.removeItem("pms_access_token"); setAccessToken(""); }}>退出登录</button>
      </header>
      <section className="summary-row">
        <div><strong>{projects.length}</strong><span>个项目</span></div>
        <div><strong>{workItems.length}</strong><span>当前项目任务</span></div>
        <div><strong>{workItems.filter((item) => item.status === "DONE").length}</strong><span>已完成</span></div>
      </section>
      <section className="project-grid">
        {projects.map((project) => <button className="project-card" type="button" key={project.id} onClick={() => setSelectedProjectId(project.id)}><div className="project-dot" /><p className="eyebrow">{project.status}</p><h2>{project.name}</h2><p>{project.description}</p><footer><span>负责人 {project.ownerId}</span><span>{project.targetDate}</span></footer></button>)}
      </section>
      <section className="task-panel">
        <div className="task-panel-header"><div><p className="eyebrow">项目执行</p><h2>{selectedProject?.name || "请选择项目"}</h2></div><form onSubmit={createTask}><input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="输入任务名称" /><button type="submit">新建任务</button></form></div>
        {loading && <p className="muted-text">正在加载项目…</p>}
        {!loading && workItems.map((item) => <article className="task-row" key={item.id}><div><strong>{item.title}</strong><p>{item.type} · {item.priority} · 截止 {item.dueDate || "未设置"}</p></div><span>{item.status === "DONE" ? "已完成" : item.status === "IN_PROGRESS" ? "进行中" : "待处理"}</span>{item.status !== "DONE" && <button type="button" onClick={() => completeTask(item)}>完成</button>}</article>)}
      </section>
    </main>
  );
}

export default function App() {
  return <ConnectedWebApp />;
}
