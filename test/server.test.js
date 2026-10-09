const test = require("node:test");
const assert = require("node:assert");

test("module loads and boots an HTTP server", async () => {
  // The server reads PORT at require-time; use a fresh subprocess for isolation.
  const { spawnSync } = require("node:child_process");
  const res = spawnSync(process.execPath, ["-e", `
    process.env.PORT = "0";
    const http = require("http");
    require("./src/server.js");
    setTimeout(() => process.exit(0), 300);
  `], { cwd: __dirname + "/..", encoding: "utf8", timeout: 10000 });
  assert.strictEqual(res.status, 0, `server exited ${res.status}: ${res.stderr}`);
});

test("health endpoint responds ok", async () => {
  const { spawn } = require("node:child_process");
  const child = spawn(process.execPath, ["src/server.js"], {
    cwd: __dirname + "/..",
    env: { ...process.env, PORT: "18321" },
  });
  try {
    // wait for listen
    await new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error("server did not start")), 5000);
      child.stdout.on("data", () => { clearTimeout(t); resolve(); });
      child.on("exit", (c) => reject(new Error("server exited early " + c)));
    });
    const res = await fetch("http://localhost:18321/health");
    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.ok, true);
  } finally {
    child.kill();
  }
});

test("unknown routes return 404 not_found", async () => {
  const { spawn } = require("node:child_process");
  const child = spawn(process.execPath, ["src/server.js"], {
    cwd: __dirname + "/..",
    env: { ...process.env, PORT: "18322" },
  });
  try {
    await new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error("server did not start")), 5000);
      child.stdout.on("data", () => { clearTimeout(t); resolve(); });
      child.on("exit", (c) => reject(new Error("server exited early " + c)));
    });
    const res = await fetch("http://localhost:18322/nope");
    const body = await res.json();
    assert.strictEqual(res.status, 404);
    assert.strictEqual(body.error, "not_found");
  } finally {
    child.kill();
  }
});
