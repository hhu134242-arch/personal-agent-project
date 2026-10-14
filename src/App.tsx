import { Flexbox } from '@lobehub/ui';
import {
  ActionIcon,
  Avatar,
  AvatarGroup,
  Badge,
  Button,
  Segmented,
  Steps,
  Table,
  Tag,
  Text,
  toast,
} from '@lobehub/ui/base-ui';
import type { StepItem } from '@lobehub/ui/base-ui';
import {
  ChatHeader,
  ChatHeaderTitle,
  ChatInputActionBar,
  ChatInputArea,
  ChatItem,
  ChatSendButton,
  LoadingDots,
} from '@lobehub/ui/chat';
import {
  ConsoleBrand,
  ConsoleNav,
  ConsoleShell,
  MetricStrip,
  PageHeader,
  Surface,
} from '@lobehub/ui/dashboard';
import type { ConsoleNavGroup } from '@lobehub/ui/dashboard';
import { Lark } from '@lobehub/ui/icons';
import {
  AtSign,
  ExternalLink,
  Hash,
  ListTodo,
  Moon,
  Paperclip,
  Pin,
  ScrollText,
  Search,
  ShieldCheck,
  SquareSlash,
  Sun,
  Workflow,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  ApprovalCard,
  type ApprovalState,
  ParsedItemCard,
  PipelineFailureCard,
  WorkItemSyncCard,
  priorityColor,
  statusColor,
} from './cards';
import { type AgentId, type Message, type WorkItem, members, seedMessages, seedWorkItems } from './data';

const CHANNEL = '/c/pay-service';

interface AppProps {
  onToggleTheme: () => void;
  themeMode: 'light' | 'dark';
}

/** Turn a free-form chat line into a structured work item, the way the PM agent would. */
const parseWorkItem = (text: string, nextId: number): WorkItem => {
  const assignee = text.match(/@(\S+)/)?.[1] ?? 'PM';
  const priority = (text.match(/\bP[0-3]\b/i)?.[0].toUpperCase() ?? 'P2') as WorkItem['priority'];
  const type: WorkItem['type'] = /bug|缺陷|报错|失败|异常/i.test(text)
    ? '缺陷'
    : /需求|希望|支持/.test(text)
      ? '需求'
      : '任务';
  const title =
    text
      .replaceAll(/@\S+/g, '')
      .replaceAll(/\bP[0-3]\b/gi, '')
      .replaceAll(/[，。,.\s]+$/g, '')
      .trim()
      .slice(0, 28) || '未命名任务';

  return { assignee, id: `PAY-${nextId}`, priority, status: '待处理', title, type };
};

const App = ({ onToggleTheme, themeMode }: AppProps) => {
  const [messages, setMessages] = useState<Message[]>(seedMessages);
  const [workItems, setWorkItems] = useState<WorkItem[]>(seedWorkItems);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState<AgentId | null>(null);
  const [approval, setApproval] = useState<ApprovalState>('pending');
  const [rollout, setRollout] = useState(0);
  const [itemFilter, setItemFilter] = useState<'all' | 'open'>('open');
  const scrollRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(232);

  useEffect(() => {
    scrollRef.current?.scrollTo({ behavior: 'smooth', top: scrollRef.current.scrollHeight });
  }, [messages, typing]);

  // Canary rollout ticks forward once the release is approved.
  useEffect(() => {
    if (approval !== 'approved' || rollout >= 100) return;
    const timer = setTimeout(() => setRollout((p) => Math.min(100, p + (p < 10 ? 10 : 15))), 1400);
    return () => clearTimeout(timer);
  }, [approval, rollout]);

  const pushMessage = (message: Omit<Message, 'id' | 'time'>) =>
    setMessages((list) => [...list, { ...message, id: crypto.randomUUID(), time: Date.now() }]);

  const replyLater = (agent: AgentId, delay: number, message: Omit<Message, 'id' | 'time' | 'agent'>) => {
    setTyping(agent);
    setTimeout(() => {
      setTyping(null);
      pushMessage({ agent, ...message });
    }, delay);
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || typing) return;
    setInput('');
    pushMessage({ agent: 'me', content: text });

    const item = parseWorkItem(text, nextId.current++);
    setWorkItems((list) => [item, ...list]);
    replyLater('pm', 1200, {
      card: 'parsed-item',
      content: `已登记为**${item.type}**，指派给 ${item.assignee}。`,
      workItem: item,
    });
  };

  const handleApprove = () => {
    setApproval('approved');
    setRollout(0);
    toast.success({ description: 'pay-api v2.8.1 开始灰度发布', title: '已批准' });
    replyLater('release', 1600, {
      content: '收到批准。先放 **10%** 流量灰度，错误率、P99 延迟和退款成功率都正常就继续放量。',
    });
  };

  const handleReject = () => {
    setApproval('rejected');
    toast.info({ description: '本次发布已撤回', title: '已拒绝' });
  };

  const handleRerun = () => {
    toast.info({ description: '已触发 pay-api #1844', id: 'rerun', title: '重新运行' });
    replyLater('flow', 1400, { content: '🔁 **pay-api #1844** 已排队，前面还有 1 个任务。' });
  };

  const renderCard = (message: Message) => {
    switch (message.card) {
      case 'pipeline-failure': {
        return <PipelineFailureCard onRerun={handleRerun} />;
      }
      case 'work-item': {
        return <WorkItemSyncCard />;
      }
      case 'approval': {
        return (
          <ApprovalCard
            onApprove={handleApprove}
            onReject={handleReject}
            rolloutPercent={rollout}
            state={approval}
          />
        );
      }
      case 'parsed-item': {
        return message.workItem ? <ParsedItemCard item={message.workItem} /> : null;
      }
      default: {
        return null;
      }
    }
  };

  const openCount = workItems.filter((i) => i.status !== '已完成').length;
  const pendingApprovals = approval === 'pending' ? 1 : 0;

  const navGroups: ConsoleNavGroup[] = [
    {
      items: [
        { badge: pendingApprovals || undefined, href: CHANNEL, icon: Hash, label: 'pay-service' },
        { href: '/c/web-frontend', icon: Hash, label: 'web-frontend' },
        { href: '/c/release-train', icon: Hash, label: 'release-train' },
      ],
      key: 'channels',
      label: '群聊',
    },
    {
      items: [
        { href: '/v/items', icon: ListTodo, label: '工作项' },
        { href: '/v/pipelines', icon: Workflow, label: '流水线' },
        { href: '/v/audit', icon: ScrollText, label: '审计日志' },
      ],
      key: 'views',
      label: '全局视图',
    },
  ];

  const pipelineSteps: StepItem[] = [
    { description: '0 个阻断问题', title: '代码扫描' },
    { description: 'registry/pay-api:2.8.1', title: '构建镜像' },
    { description: '#1843 · 215 / 215 通过', title: '单元测试' },
    { description: 'staging · 冒烟 32 项通过', title: '预发验证' },
    {
      description:
        approval === 'rejected' ? '已拒绝' : approval === 'approved' ? '林舟 已批准' : '等待服务 Owner',
      status: approval === 'rejected' ? 'error' : undefined,
      title: '生产审批',
    },
    {
      description: approval === 'approved' ? `灰度 ${rollout}%` : '未开始',
      title: '灰度发布',
    },
  ];
  const currentStep = approval === 'approved' ? (rollout >= 100 ? 6 : 5) : 4;

  const visibleItems = useMemo(
    () => (itemFilter === 'open' ? workItems.filter((i) => i.status !== '已完成') : workItems),
    [itemFilter, workItems],
  );

  return (
    <ConsoleShell
      brand={<ConsoleBrand logo={<Lark.Color size={22} />} title="Agent 控制台" />}
      footer={
        <Flexbox gap={4} padding={12}>
          <Badge status="success" text="云效 MCP 已连接" />
          <Text fontSize={12} type="secondary">
            飞书 · 支付中台
          </Text>
        </Flexbox>
      }
      navigation={
        <ConsoleNav
          groups={navGroups}
          onNavigate={(href) => {
            if (href !== CHANNEL) toast.info({ id: 'demo-nav', title: '演示版只包含 #pay-service' });
          }}
          pathname={CHANNEL}
        />
      }
      storageKey="personal-agent-nav"
      tools={
        <Flexbox align="center" gap={8} horizontal>
          <ActionIcon
            icon={themeMode === 'dark' ? Sun : Moon}
            onClick={onToggleTheme}
            title={themeMode === 'dark' ? '切换到浅色' : '切换到深色'}
          />
          <Avatar avatar={members.me.avatar} size={28} />
        </Flexbox>
      }
    >
      <div className="workspace">
        <PageHeader
          action={
            <Flexbox align="center" gap={12} horizontal>
              <AvatarGroup
                items={(['flow', 'coder', 'release', 'pm'] as const).map((key) => ({
                  avatar: members[key].avatar,
                  key,
                  title: `${members[key].title} · ${members[key].role}`,
                }))}
                size={28}
              />
              <Button icon={ExternalLink}>在云效打开</Button>
            </Flexbox>
          }
          description="飞书群 #pay-service 已绑定云效项目「支付中台」。聊天负责发起，卡片负责确认，状态全部回写云效。"
          title="支付中台"
        />

        <MetricStrip
          items={[
            { hint: `共 ${workItems.length} 项`, label: '未完成工作项', mark: ListTodo, value: openCount },
            { delta: '+4', direction: 'up', hint: '较昨日', label: '今日构建', mark: Workflow, value: 23 },
            {
              delta: '-2.1%',
              direction: 'down',
              hint: '近 7 天',
              label: '构建成功率',
              value: '91.3%',
            },
            {
              hint: pendingApprovals ? '生产发布' : '没有待办',
              label: '待审批',
              mark: ShieldCheck,
              value: pendingApprovals,
              valueTone: pendingApprovals ? 'warning' : undefined,
            },
          ]}
        />

        <div className="main-grid">
          <Surface className="chat-panel">
            <ChatHeader
              left={
                <ChatHeaderTitle
                  desc="林舟、许岚 和 4 个 Agent"
                  tag={
                    <Tag color="blue" size="small">
                      飞书
                    </Tag>
                  }
                  title="# pay-service"
                />
              }
              paddingInline={16}
              right={
                <Flexbox gap={4} horizontal>
                  <ActionIcon icon={Search} size="small" title="搜索消息" />
                  <ActionIcon icon={Pin} size="small" title="置顶" />
                </Flexbox>
              }
            />
            <div className="chat-scroll" ref={scrollRef}>
              {messages.map((message) => {
                const member = members[message.agent];
                const isMe = message.agent === 'me';
                return (
                  <ChatItem
                    avatar={member}
                    key={message.id}
                    message={message.content}
                    messageExtra={renderCard(message)}
                    placement={isMe ? 'right' : 'left'}
                    primary={isMe}
                    showTitle
                    time={message.time}
                    titleAddon={
                      isMe ? undefined : (
                        <Tag size="small" variant="borderless">
                          {member.role}
                        </Tag>
                      )
                    }
                  />
                );
              })}
              {typing && (
                <Flexbox align="center" gap={8} horizontal paddingInline={16}>
                  <Avatar avatar={members[typing].avatar} background={members[typing].backgroundColor} size={28} />
                  <LoadingDots variant="typing" />
                  <Text fontSize={12} type="secondary">
                    {members[typing].title} 正在处理…
                  </Text>
                </Flexbox>
              )}
            </div>
            <ChatInputArea
              bottomAddons={
                <ChatInputActionBar
                  leftAddons={
                    <Flexbox gap={4} horizontal>
                      <ActionIcon
                        icon={AtSign}
                        onClick={() => setInput((v) => `${v}@Coder `)}
                        size="small"
                        title="@ 一个 Agent"
                      />
                      <ActionIcon icon={SquareSlash} size="small" title="快捷指令" />
                      <ActionIcon icon={Paperclip} size="small" title="附件" />
                    </Flexbox>
                  }
                  rightAddons={
                    <ChatSendButton
                      loading={!!typing}
                      onSend={handleSend}
                      style={{ whiteSpace: 'nowrap' }}
                      texts={{ send: '发送', stop: '停止', warp: '换行' }}
                    />
                  }
                />
              }
              expand={false}
              heights={{ inputHeight: 150, maxHeight: 320, minHeight: 120 }}
              loading={!!typing}
              onInput={setInput}
              onSend={handleSend}
              placeholder="@Agent 派活，或直接描述一个需求 / 缺陷，比如：商户导出 CSV 超时 P1 @Coder"
              value={input}
            />
          </Surface>

          <div className="side-column">
            <Surface
              description="pay-api · v2.8.1"
              extra={
                <Tag color={approval === 'rejected' ? 'error' : approval === 'approved' ? 'success' : 'warning'} size="small">
                  {approval === 'rejected' ? '已终止' : approval === 'approved' ? '发布中' : '待审批'}
                </Tag>
              }
              title="发布流水线"
            >
              <Steps current={currentStep} items={pipelineSteps} orientation="vertical" variant="dot" />
            </Surface>

            <Surface
              extra={
                <Segmented
                  onChange={setItemFilter}
                  options={[
                    { label: '未完成', value: 'open' },
                    { label: '全部', value: 'all' },
                  ]}
                  size="small"
                  value={itemFilter}
                />
              }
              title="工作项"
            >
              <Table<WorkItem>
                columns={[
                  {
                    dataIndex: 'title',
                    key: 'title',
                    render: (_, item) => (
                      <Flexbox gap={2}>
                        <Text ellipsis={{ tooltip: true }} strong>
                          {item.title}
                        </Text>
                        <Text fontSize={12} type="secondary">
                          {item.id} · {item.assignee}
                        </Text>
                      </Flexbox>
                    ),
                    title: '工作项',
                  },
                  {
                    dataIndex: 'priority',
                    key: 'priority',
                    render: (_, item) => (
                      <Tag color={priorityColor[item.priority]} size="small">
                        {item.priority}
                      </Tag>
                    ),
                    title: '优先级',
                    width: 72,
                  },
                  {
                    dataIndex: 'status',
                    key: 'status',
                    render: (_, item) => (
                      <Tag color={statusColor[item.status]} size="small">
                        {item.status}
                      </Tag>
                    ),
                    title: '状态',
                    width: 80,
                  },
                ]}
                dataSource={visibleItems}
                pagination={false}
                rowKey="id"
                size="small"
              />
            </Surface>
          </div>
        </div>
      </div>
    </ConsoleShell>
  );
};

export default App;
