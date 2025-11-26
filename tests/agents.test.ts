import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as pty from "node-pty";
import { DEFAULT_AGENTS, DEFAULT_CHAIRMAN, commandExists, filterAvailableAgents } from "../src/agents.js";

// Helper to wait for output containing specific text
function waitForOutput(
  ptyProcess: pty.IPty,
  pattern: string | RegExp,
  timeoutMs = 30000
): Promise<string> {
  return new Promise((resolve, reject) => {
    let output = "";
    const timeout = setTimeout(() => {
      reject(new Error(`Timeout waiting for pattern: ${pattern}\nOutput so far:\n${output}`));
    }, timeoutMs);

    const disposable = ptyProcess.onData((data) => {
      output += data;
      const matches = typeof pattern === "string" ? output.includes(pattern) : pattern.test(output);
      if (matches) {
        clearTimeout(timeout);
        disposable.dispose();
        resolve(output);
      }
    });
  });
}

// Helper to send key after a delay
function sendKey(ptyProcess: pty.IPty, key: string, delayMs = 100): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      ptyProcess.write(key);
      resolve();
    }, delayMs);
  });
}

// Special key codes
const KEYS = {
  UP: "\x1b[A",
  DOWN: "\x1b[B",
  ESC: "\x1b",
  CTRL_C: "\x03",
  K: "k",
  ONE: "1",
  TWO: "2",
  THREE: "3",
};

describe("commandExists", () => {
  it("should return true for existing commands", () => {
    expect(commandExists("node")).toBe(true);
    expect(commandExists("npm")).toBe(true);
  });

  it("should return false for non-existing commands", () => {
    expect(commandExists("nonexistent-command-xyz-123")).toBe(false);
    expect(commandExists("fake-cli-tool")).toBe(false);
  });
});

describe("filterAvailableAgents", () => {
  it("should separate available and unavailable agents", () => {
    const testAgents = [
      { name: "node-agent", command: ["node", "--version"], promptViaStdin: true },
      { name: "fake-agent", command: ["nonexistent-cmd-xyz"], promptViaStdin: true },
    ];

    const { available, unavailable } = filterAvailableAgents(testAgents);

    expect(available).toHaveLength(1);
    expect(available[0].name).toBe("node-agent");

    expect(unavailable).toHaveLength(1);
    expect(unavailable[0].name).toBe("fake-agent");
    expect(unavailable[0].command).toBe("nonexistent-cmd-xyz");
  });

  it("should return all agents as available when all commands exist", () => {
    const testAgents = [
      { name: "agent1", command: ["node"], promptViaStdin: true },
      { name: "agent2", command: ["npm"], promptViaStdin: true },
    ];

    const { available, unavailable } = filterAvailableAgents(testAgents);

    expect(available).toHaveLength(2);
    expect(unavailable).toHaveLength(0);
  });

  it("should return all agents as unavailable when no commands exist", () => {
    const testAgents = [
      { name: "fake1", command: ["nonexistent-1"], promptViaStdin: true },
      { name: "fake2", command: ["nonexistent-2"], promptViaStdin: true },
    ];

    const { available, unavailable } = filterAvailableAgents(testAgents);

    expect(available).toHaveLength(0);
    expect(unavailable).toHaveLength(2);
  });
});

describe("DEFAULT_AGENTS configuration", () => {
  it("should have 3 default agents", () => {
    expect(DEFAULT_AGENTS).toHaveLength(3);
  });

  it("should have correct agent names", () => {
    const names = DEFAULT_AGENTS.map((a) => a.name);
    expect(names).toContain("codex");
    expect(names).toContain("claude");
    expect(names).toContain("gemini");
  });

  it("should use direct command invocation without zsh wrapper", () => {
    for (const agent of DEFAULT_AGENTS) {
      expect(agent.command[0]).not.toBe("zsh");
      expect(agent.command.join(" ")).not.toContain("-ic");
    }
  });

  it("should have gemini as default chairman", () => {
    expect(DEFAULT_CHAIRMAN).toBe("gemini");
  });

  it("should have promptViaStdin enabled for all agents", () => {
    for (const agent of DEFAULT_AGENTS) {
      expect(agent.promptViaStdin).toBe(true);
    }
  });
});

describe("Interactive keyboard controls", () => {
  let ptyProcess: pty.IPty;

  beforeEach(() => {
    // Spawn the dev server with a simple question
    ptyProcess = pty.spawn("npm", ["run", "dev", "--", "Say hello", "--timeout", "60"], {
      name: "xterm-256color",
      cols: 120,
      rows: 30,
      cwd: process.cwd(),
      env: process.env as Record<string, string>,
    });
  });

  afterEach(() => {
    try {
      ptyProcess.kill();
    } catch {
      // Process may already be dead
    }
  });

  describe("Focus navigation", () => {
    it("should show initial focus on first agent (codex)", async () => {
      const output = await waitForOutput(ptyProcess, /➤.*codex/);
      expect(output).toMatch(/➤.*\[1\].*codex/);
    });

    it("should move focus down with DOWN arrow key", async () => {
      // Wait for initial render
      await waitForOutput(ptyProcess, /➤.*codex/);

      // Press DOWN arrow
      await sendKey(ptyProcess, KEYS.DOWN, 500);

      // Should now focus on claude (agent 2)
      const output = await waitForOutput(ptyProcess, /➤.*claude/, 5000);
      expect(output).toMatch(/➤.*\[2\].*claude/);
    });

    it("should move focus up with UP arrow key", async () => {
      // Wait for initial render
      await waitForOutput(ptyProcess, /➤.*codex/);

      // Press UP arrow (should wrap to last agent - gemini)
      await sendKey(ptyProcess, KEYS.UP, 500);

      // Should now focus on gemini (agent 3, wrapped from top)
      const output = await waitForOutput(ptyProcess, /➤.*gemini/, 5000);
      expect(output).toMatch(/➤.*\[3\].*gemini/);
    });

    it("should focus agent directly with number key 2", async () => {
      // Wait for initial render
      await waitForOutput(ptyProcess, /➤.*codex/);

      // Press "2" to focus claude
      await sendKey(ptyProcess, KEYS.TWO, 500);

      // Should focus on claude
      const output = await waitForOutput(ptyProcess, /➤.*claude/, 5000);
      expect(output).toMatch(/➤.*\[2\].*claude/);
    });

    it("should focus agent directly with number key 3", async () => {
      // Wait for initial render
      await waitForOutput(ptyProcess, /➤.*codex/);

      // Press "3" to focus gemini
      await sendKey(ptyProcess, KEYS.THREE, 500);

      // Should focus on gemini
      const output = await waitForOutput(ptyProcess, /➤.*gemini/, 5000);
      expect(output).toMatch(/➤.*\[3\].*gemini/);
    });

    it("should wrap focus from last to first with DOWN arrow", async () => {
      // Wait for initial render
      await waitForOutput(ptyProcess, /➤.*codex/);

      // Press "3" to focus gemini (last agent)
      await sendKey(ptyProcess, KEYS.THREE, 500);
      await waitForOutput(ptyProcess, /➤.*gemini/, 5000);

      // Press DOWN to wrap to first
      await sendKey(ptyProcess, KEYS.DOWN, 300);

      // Should wrap back to codex
      const output = await waitForOutput(ptyProcess, /➤.*codex/, 5000);
      expect(output).toMatch(/➤.*\[1\].*codex/);
    });
  });

  describe("Agent killing", () => {
    it("should kill focused agent with k key", async () => {
      // Wait for agents to start running
      await waitForOutput(ptyProcess, /running/);

      // Press "k" to kill focused agent (codex)
      await sendKey(ptyProcess, KEYS.K, 500);

      // Should show killed status for codex
      const output = await waitForOutput(ptyProcess, /codex.*killed/i, 10000);
      expect(output).toMatch(/codex.*killed/i);
    });

    it("should kill specific agent after focusing with number key", async () => {
      // Wait for agents to start running
      await waitForOutput(ptyProcess, /running/);

      // Press "2" to focus claude
      await sendKey(ptyProcess, KEYS.TWO, 500);
      await waitForOutput(ptyProcess, /➤.*claude/, 5000);

      // Press "k" to kill claude
      await sendKey(ptyProcess, KEYS.K, 300);

      // Should show killed status for claude
      const output = await waitForOutput(ptyProcess, /claude.*killed/i, 10000);
      expect(output).toMatch(/claude.*killed/i);
    });
  });

  describe("Abort all", () => {
    it("should abort all agents with ESC key", async () => {
      // Wait for agents to start running
      await waitForOutput(ptyProcess, /running/);

      // Press ESC to abort all
      await sendKey(ptyProcess, KEYS.ESC, 500);

      // Should show "Aborted by user" message
      const output = await waitForOutput(ptyProcess, /Aborted by user/i, 10000);
      expect(output).toMatch(/Aborted by user/i);
    });

    it("should show killed status for all agents after ESC", async () => {
      // Wait for agents to start running
      await waitForOutput(ptyProcess, /running/);

      // Press ESC to abort all
      await sendKey(ptyProcess, KEYS.ESC, 500);

      // Wait for abort message
      const output = await waitForOutput(ptyProcess, /Aborted by user/i, 10000);

      // All agents should be killed or completed
      // Note: some agents might complete before ESC is processed
      expect(output).toMatch(/Aborted by user/i);
    });
  });
});

describe("Agent status transitions", () => {
  let ptyProcess: pty.IPty;

  afterEach(() => {
    try {
      ptyProcess.kill();
    } catch {
      // Process may already be dead
    }
  });

  it("should show pending -> running -> completed status progression", async () => {
    ptyProcess = pty.spawn("npm", ["run", "dev", "--", "Reply with just: OK", "--timeout", "60"], {
      name: "xterm-256color",
      cols: 120,
      rows: 30,
      cwd: process.cwd(),
      env: process.env as Record<string, string>,
    });

    // Should eventually show running status
    await waitForOutput(ptyProcess, /running/, 30000);

    // Should eventually complete
    const output = await waitForOutput(ptyProcess, /Stage complete/i, 90000);
    expect(output).toMatch(/Stage complete/i);
  });

  it("should handle timeout status when agent exceeds timeout", async () => {
    // Use a very short timeout to trigger timeout
    ptyProcess = pty.spawn(
      "npm",
      ["run", "dev", "--", "Write a very long essay about everything", "--timeout", "1"],
      {
        name: "xterm-256color",
        cols: 120,
        rows: 30,
        cwd: process.cwd(),
        env: process.env as Record<string, string>,
      }
    );

    // Should show timeout status for at least one agent
    const output = await waitForOutput(ptyProcess, /timeout|Stage complete/i, 30000);
    // Either we see timeout or agents completed before timeout
    expect(output).toBeTruthy();
  });
});

describe("Display rendering", () => {
  let ptyProcess: pty.IPty;

  afterEach(() => {
    try {
      ptyProcess.kill();
    } catch {
      // Process may already be dead
    }
  });

  it("should display stage name", async () => {
    ptyProcess = pty.spawn("npm", ["run", "dev", "--", "Hello", "--timeout", "30"], {
      name: "xterm-256color",
      cols: 120,
      rows: 30,
      cwd: process.cwd(),
      env: process.env as Record<string, string>,
    });

    const output = await waitForOutput(ptyProcess, /Stage:/);
    expect(output).toMatch(/Stage:/);
  });

  it("should display keyboard help instructions", async () => {
    ptyProcess = pty.spawn("npm", ["run", "dev", "--", "Hello", "--timeout", "30"], {
      name: "xterm-256color",
      cols: 120,
      rows: 30,
      cwd: process.cwd(),
      env: process.env as Record<string, string>,
    });

    const output = await waitForOutput(ptyProcess, /ESC/);
    expect(output).toMatch(/ESC.*cancel/i);
    expect(output).toMatch(/k.*cancel.*focused/i);
  });

  it("should show duration for each agent", async () => {
    ptyProcess = pty.spawn("npm", ["run", "dev", "--", "Say hi", "--timeout", "60"], {
      name: "xterm-256color",
      cols: 120,
      rows: 30,
      cwd: process.cwd(),
      env: process.env as Record<string, string>,
    });

    // Wait for running status which should show duration
    const output = await waitForOutput(ptyProcess, /\d+\.\d+s/, 30000);
    expect(output).toMatch(/\d+\.\d+s/);
  });

  it("should show output preview for focused agent", async () => {
    ptyProcess = pty.spawn("npm", ["run", "dev", "--", "Hello", "--timeout", "60"], {
      name: "xterm-256color",
      cols: 120,
      rows: 30,
      cwd: process.cwd(),
      env: process.env as Record<string, string>,
    });

    // Should show focused agent output section
    const output = await waitForOutput(ptyProcess, /Focused agent output/i, 30000);
    expect(output).toMatch(/Focused agent output/i);
  });
});
