import { Flexbox, Highlighter } from '@lobehub/ui';
import { Alert, Button, Descriptions, Progress, Tag, Text } from '@lobehub/ui/base-ui';
import { Check, ExternalLink, GitPullRequest, RotateCw, Wrench, X } from 'lucide-react';

import { type WorkItem, failureLog } from './data';

export type ApprovalState = 'pending' | 'approved' | 'rejected';

export const statusColor: Record<WorkItem['status'], string> = {
  已完成: 'success',
  待处理: 'gray',
  评审中: 'purple',
  进行中: 'blue',
};

export const priorityColor: Record<WorkItem['priority'], string> = {
  P0: 'red',
  P1: 'volcano',
  P2: 'gold',
  P3: 'gray',
};

interface PipelineFailureCardProps {
  onRerun: () => void;
}

export const PipelineFailureCard = ({ onRerun }: PipelineFailureCardProps) => (
  <div className="chat-card">
    <Alert
      description="RefundService.calc 部分退款的分位精度断言不通过"
      extra={<Highlighter language="bash">{failureLog}</Highlighter>}
      title="单元测试失败 · 1 / 215"
      type="error"
      variant="outlined"
    />
    <Flexbox gap={8} horizontal wrap="wrap">
      <Button disabled icon={Wrench} size="small" type="primary">
        已指派给 Coder
      </Button>
      <Button icon={RotateCw} onClick={onRerun} size="small">
        重新运行
      </Button>
      <Button icon={ExternalLink} size="small" type="text">
        在云效查看
      </Button>
    </Flexbox>
  </div>
);

export const WorkItemSyncCard = () => (
  <div className="chat-card">
    <Descriptions
      bordered
      column={2}
      extra={
        <Tag color="success" size="small">
          已同步云效
        </Tag>
      }
      items={[
        { children: 'PAY-231 退款金额精度丢失', key: 'item', label: '工作项', span: 2 },
        {
          children: (
            <Flexbox align="center" gap={4} horizontal>
              <Tag color="gray" size="small">
                待处理
              </Tag>
              →
              <Tag color="blue" size="small">
                进行中
              </Tag>
            </Flexbox>
          ),
          key: 'status',
          label: '状态',
        },
        { children: 'Coder', key: 'assignee', label: '负责人' },
        {
          children: (
            <Flexbox align="center" gap={4} horizontal>
              <GitPullRequest size={14} />
              !482 fix/refund-precision
            </Flexbox>
          ),
          key: 'mr',
          label: '合并请求',
          span: 2,
        },
      ]}
      title="变更回写"
    />
  </div>
);

interface ApprovalCardProps {
  onApprove: () => void;
  onReject: () => void;
  rolloutPercent: number;
  state: ApprovalState;
}

export const ApprovalCard = ({ onApprove, onReject, rolloutPercent, state }: ApprovalCardProps) => (
  <div className="chat-card">
    <Descriptions
      bordered
      column={2}
      items={[
        { children: 'production', key: 'env', label: '环境' },
        { children: 'v2.8.0 → v2.8.1', key: 'version', label: '版本' },
        { children: '3 次提交 · 1 个合并请求', key: 'diff', label: '变更' },
        {
          children: (
            <Tag color="warning" size="small">
              中 · 涉及资金链路
            </Tag>
          ),
          key: 'risk',
          label: '风险',
        },
      ]}
      title="发布审批"
    />
    {state === 'pending' && (
      <Flexbox gap={8} horizontal wrap="wrap">
        <Button icon={Check} onClick={onApprove} size="small" type="primary">
          批准发布
        </Button>
        <Button danger icon={X} onClick={onReject} size="small">
          拒绝
        </Button>
        <Button icon={ExternalLink} size="small" type="text">
          查看变更
        </Button>
      </Flexbox>
    )}
    {state === 'approved' && (
      <Alert
        description={
          <Progress
            label="灰度流量"
            percent={rolloutPercent}
            status={rolloutPercent >= 100 ? 'success' : 'active'}
          />
        }
        title="林舟 已批准，正在灰度发布"
        type="success"
      />
    )}
    {state === 'rejected' && (
      <Alert description="Release 已撤回本次发布，变更保留在预发环境。" title="已拒绝" type="secondary" />
    )}
  </div>
);

export const ParsedItemCard = ({ item }: { item: WorkItem }) => (
  <div className="chat-card">
    <Descriptions
      bordered
      column={2}
      extra={
        <Tag color="success" size="small">
          已写入云效
        </Tag>
      }
      items={[
        { children: `${item.id} ${item.title}`, key: 'title', label: '标题', span: 2 },
        { children: item.type, key: 'type', label: '类型' },
        {
          children: (
            <Tag color={priorityColor[item.priority]} size="small">
              {item.priority}
            </Tag>
          ),
          key: 'priority',
          label: '优先级',
        },
        { children: item.assignee, key: 'assignee', label: '负责人' },
        {
          children: (
            <Tag color={statusColor[item.status]} size="small">
              {item.status}
            </Tag>
          ),
          key: 'status',
          label: '状态',
        },
      ]}
      title="从对话中提取的工作项"
    />
    <Text fontSize={12} type="secondary">
      字段由 PM 根据这条消息自动填写，可以直接在云效里修改。
    </Text>
  </div>
);
