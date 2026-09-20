/** Mock：AI 推理（julyAiInference）—— SSE 流式逐字回调，OpenAI 风格协议本地模拟 */
import type { AiChatRequestVo011 } from '@/types/aiCenter';

function buildMockReply(req: AiChatRequestVo011): string {
  const lastUser = [...req.messages].reverse().find((m) => m.role === 'user')?.content || '';
  return [
    `（Mock 流式）模型 \`${req.model}\``,
    '',
    `你说：${lastUser}`,
    '',
    '这是一段 **Markdown** 示例：',
    '',
    '- 切到 API 模式即走后端 `/klsjnh/aicenter/julyAiInference/v1/chat/stream`',
    '- 当前为 mock 逐字模拟，未发起网络请求',
    '',
    '| 能力 | 状态 |',
    '| --- | --- |',
    '| 流式输出 | Mock 已模拟 |',
    '| 后端 SSE | 待联调 |',
  ].join('\n');
}

/** Mock SSE：逐字回调，模拟流式观感 */
export async function mockStreamChat(
  req: AiChatRequestVo011,
  onDelta: (text: string) => void,
  onReasoning?: () => void,
): Promise<void> {
  onReasoning?.();
  await new Promise((r) => setTimeout(r, 280));
  const full = buildMockReply(req);
  for (const ch of full) {
    onDelta(ch);
    await new Promise((r) => setTimeout(r, 8));
  }
}
