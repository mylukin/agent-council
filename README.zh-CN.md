# Agent Council

多模型 AI 理事会 CLI，使用 Claude、Codex 和 Gemini 提供共识驱动的决策。

## 工作原理

```text
阶段 1：独立响应
  所有代理并行回答问题

阶段 2：同行排名
  每个代理评估并排名所有响应

阶段 3：主席综合
  指定代理根据所有响应和排名综合最终答案
```

## 安装

```bash
# 从 npm 全局安装
npm install -g agent-council

# 或克隆并本地构建
git clone https://github.com/mylukin/agent-council.git
cd agent-council
npm install
npm link
```

## Claude Code 插件

将 agent-council 作为 Claude Code 插件使用，实现无缝集成：

```bash
# 步骤 1：全局安装 CLI
npm install -g agent-council

# 步骤 2：添加市场（在 Claude Code 中）
/plugin marketplace add mylukin/agent-council

# 步骤 3：安装插件
/plugin install agent-council
```

插件提供：
- **council** 代理：用于复杂的架构决策
- **council-decision** 技能：自动触发设计权衡

## 前置条件

以下 CLI 工具必须安装并配置：

- [Claude Code](https://github.com/anthropics/claude-code) (`claude`)
- [Codex CLI](https://github.com/openai/codex) (`codex`)
- [Gemini CLI](https://github.com/google-gemini/gemini-cli) (`gemini`)

至少需要一个代理可用。多个代理时理事会效果最佳。

## 使用方法

### REPL 模式（交互式）

```bash
# 启动交互模式
agent-council

> 实时分析最好用什么数据库？
# 理事会处理并响应...

> 成本方面呢？
# 带有对话历史的追问...
```

### 单问题模式

```bash
agent-council "你的问题"

# 选项
agent-council "问题" --chairman gemini  # 设置主席（默认：gemini）
agent-council "问题" --timeout 60       # 每个代理超时秒数
agent-council "问题" --json             # 输出为 JSON
```

### 斜杠命令（REPL 模式）

| 命令 | 描述 |
|------|------|
| `/help` | 显示可用命令 |
| `/agents` | 列出可用代理 |
| `/chairman [name]` | 显示或设置主席 |
| `/timeout [seconds]` | 显示或设置超时 |
| `/history` | 显示对话历史 |
| `/clear` | 清除对话历史 |
| `/exit` | 退出 REPL |

## 交互控制

执行过程中，使用以下键盘控制：

| 按键 | 操作 |
|------|------|
| `1`, `2`, `3` | 聚焦代理 N |
| `↑` / `↓` | 导航聚焦 |
| `k` | 终止聚焦的代理 |
| `ESC` | 终止所有代理 |
| `Ctrl+C` | 退出 |

## 开发

```bash
npm run dev -- "测试问题"  # 不构建直接运行
npm test                   # 运行测试
npm run test:watch         # 监听模式运行测试
```

## 许可证

MIT
