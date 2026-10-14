export type AgentId = 'flow' | 'coder' | 'release' | 'pm' | 'me';

export interface Member {
  avatar: string;
  backgroundColor?: string;
  role: string;
  title: string;
}

export const members: Record<AgentId, Member> = {
  coder: { avatar: '🧑‍💻', backgroundColor: '#e6f4ff', role: '编码 Agent', title: 'Coder' },
  flow: { avatar: '🚦', backgroundColor: '#fff1f0', role: '流水线 Agent', title: 'Flow Bot' },
  me: { avatar: '林', role: '后端负责人', title: '林舟' },
  pm: { avatar: '📋', backgroundColor: '#f9f0ff', role: '项目 Agent', title: 'PM' },
  release: { avatar: '🚀', backgroundColor: '#f6ffed', role: '发布 Agent', title: 'Release' },
};

export type CardKind = 'pipeline-failure' | 'work-item' | 'approval' | 'parsed-item';

export interface WorkItem {
  assignee: string;
  id: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  status: '待处理' | '进行中' | '评审中' | '已完成';
  title: string;
  type: '缺陷' | '任务' | '需求';
}

export interface Message {
  agent: AgentId;
  card?: CardKind;
  content: string;
  id: string;
  time: number;
  /** 解析出的工作项（仅 parsed-item 卡片使用） */
  workItem?: WorkItem;
}

const now = Date.now();
const min = 60_000;

export const seedMessages: Message[] = [
  {
    agent: 'flow',
    card: 'pipeline-failure',
    content:
      '**pay-api #1842** 在「单元测试」阶段失败。我比对了最近 3 次提交，问题很可能出在 `RefundService` 的金额精度处理上。',
    id: 'm1',
    time: now - 26 * min,
  },
  {
    agent: 'me',
    content: '@Coder 修一下，顺便把 PAY-231 改成进行中。',
    id: 'm2',
    time: now - 24 * min,
  },
  {
    agent: 'coder',
    card: 'work-item',
    content:
      '收到。已从 `main` 切出 `fix/refund-precision`，把 `amount * 100` 改成 `Decimal` 运算，并补了 2 个边界用例。合并请求 **!482** 已创建，云效工作项已同步：',
    id: 'm3',
    time: now - 17 * min,
  },
  {
    agent: 'flow',
    content: '✅ **pay-api #1843** 全部通过，用时 6 分 12 秒。覆盖率 81.4%（+0.3%）。',
    id: 'm4',
    time: now - 9 * min,
  },
  {
    agent: 'release',
    card: 'approval',
    content: '**pay-api v2.8.1** 准备发布到生产环境。这次变更涉及退款链路，按策略需要 1 名服务 Owner 批准。',
    id: 'm5',
    time: now - 3 * min,
  },
];

export const seedWorkItems: WorkItem[] = [
  { assignee: 'Coder', id: 'PAY-231', priority: 'P1', status: '进行中', title: '退款金额精度丢失', type: '缺陷' },
  { assignee: '林舟', id: 'PAY-228', priority: 'P2', status: '评审中', title: '对账任务支持分片', type: '任务' },
  { assignee: 'PM', id: 'PAY-219', priority: 'P2', status: '待处理', title: '商户后台导出 CSV', type: '需求' },
  { assignee: '许岚', id: 'PAY-214', priority: 'P3', status: '已完成', title: '移除旧版回调签名', type: '任务' },
];

export const failureLog = `FAIL  src/refund/RefundService.test.ts
  ● partial refund › keeps cent precision

    expected 1999 to be 2000
      at RefundService.calc (src/refund/RefundService.ts:88:21)

Tests: 1 failed, 214 passed, 215 total`;
