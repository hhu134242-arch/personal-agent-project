# personal-agent-project

DevOps 对话控制台原型：在飞书 / 钉钉群里 @Agent 派活，聊天负责发起，卡片负责确认，状态回写云效。

基于 [@lobehub/ui](https://ui.lobehub.com/) 构建（Vite + React 19）。当前为前端演示，数据均为模拟。

## 运行

```bash
pnpm install
pnpm dev
```

## 目录

- `src/App.tsx` — 页面：控制台外框、群聊、发布流水线、工作项表格
- `src/cards.tsx` — 聊天中的交互卡片（流水线失败、工作项回写、发布审批、解析出的工作项）
- `src/data.ts` — 模拟数据
