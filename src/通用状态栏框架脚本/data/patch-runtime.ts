/**
 * Patch 运行时
 *
 * 负责从 AI 消息中提取标签化 JSON Patch，合并到框架状态，
 * 并自动维护隐藏补丁输出的酒馆正则。
 */
import { SCRIPT_TITLE } from '../core/constants';
import { renderStatusBar } from '../renderer';
import { extractPatchFromMessage } from './json-patch';
import { createSnapshot, degradePriority, mergePatches, updateMessageCount } from './merge';
import { getAllNarratives } from './narratives-store';
import type { PatchOperation } from './types';
import { loadConfig, loadSnapshot, loadState, saveSnapshot, saveState } from './variables';
import { getFrameworkWorldbook, WB_NAME } from './worldbook-inject';

const HIDE_REGEX_NAME = 'OMG_StatusBar_HidePatch';
const HIDE_REGEX_PATTERN = '<OmgPatch>[\\s\\S]*?<\\/OmgPatch>';
const NARR_STYLE_ENTRY = 'OMG_Narrative_StylePrompt';
const NARR_CHANGES_ENTRY = 'OMG_Narrative_Changes';

const processedSignature = new Set<string>();

function makeSignature(messageId: number, message: string): string {
  return `${messageId}:${message.length}:${message.slice(0, 120)}`;
}

function normalizeCharId(rawId: string): string {
  const trimmed = rawId.trim();
  if (trimmed.startsWith('char_')) return trimmed;
  const slug = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return `char_${slug || Date.now().toString(36)}`;
}

function normalizePatchPath(path: string): string {
  if (!path.startsWith('/characters/')) return path;
  const segments = path.split('/');
  if (segments.length < 3) return path;
  segments[2] = normalizeCharId(segments[2]);
  return segments.join('/');
}

function normalizePatches(patches: PatchOperation[]): PatchOperation[] {
  return patches.map(op => {
    const next = { ...op } as PatchOperation;
    (next as any).path = normalizePatchPath((op as any).path || '');
    if ('from' in next && typeof (next as any).from === 'string') {
      (next as any).from = normalizePatchPath((next as any).from);
    }
    return next;
  });
}

function formatNarrativeValue(value: unknown): string {
  if (value === undefined) return '(空)';
  if (value === null) return 'null';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  try {
    return JSON.stringify(value);
  } catch {
    return '[复杂对象]';
  }
}

export async function ensurePatchHideRegex(): Promise<void> {
  const config = loadConfig();
  const enabled = config.patchHideRegexEnabled !== false;

  await updateTavernRegexesWith(
    regexes => {
      const existing = regexes.find(r => r.script_name === HIDE_REGEX_NAME);
      if (existing) {
        existing.enabled = enabled;
        existing.find_regex = HIDE_REGEX_PATTERN;
        existing.replace_string = '';
        existing.trim_strings = '';
        existing.source = {
          user_input: false,
          ai_output: true,
          slash_command: false,
          world_info: false,
        };
        existing.destination = {
          display: true,
          prompt: false,
        };
        existing.run_on_edit = true;
        existing.min_depth = null;
        existing.max_depth = null;
        return regexes;
      }

      regexes.push({
        id: `omg_patch_hide_${Date.now().toString(36)}`,
        script_name: HIDE_REGEX_NAME,
        enabled,
        find_regex: HIDE_REGEX_PATTERN,
        replace_string: '',
        trim_strings: '',
        source: {
          user_input: false,
          ai_output: true,
          slash_command: false,
          world_info: false,
        },
        destination: {
          display: true,
          prompt: false,
        },
        run_on_edit: true,
        min_depth: null,
        max_depth: null,
      });
      return regexes;
    },
    { type: 'global' },
  );
}

export async function setPatchHideRegexEnabled(enabled: boolean): Promise<void> {
  await updateTavernRegexesWith(
    regexes => {
      const existing = regexes.find(r => r.script_name === HIDE_REGEX_NAME);
      if (existing) {
        existing.enabled = enabled;
        return regexes;
      }
      if (enabled) {
        regexes.push({
          id: `omg_patch_hide_${Date.now().toString(36)}`,
          script_name: HIDE_REGEX_NAME,
          enabled: true,
          find_regex: HIDE_REGEX_PATTERN,
          replace_string: '',
          trim_strings: '',
          source: { user_input: false, ai_output: true, slash_command: false, world_info: false },
          destination: { display: true, prompt: false },
          run_on_edit: true,
          min_depth: null,
          max_depth: null,
        });
      }
      return regexes;
    },
    { type: 'global' },
  );
}

function renderNarrativeLine(template: string, data: Record<string, string>): string {
  let line = template;
  for (const [k, v] of Object.entries(data)) {
    line = line.replaceAll(`{{${k}}}`, v);
  }
  return line;
}

async function syncNarrativeWorldbook(
  preState: ReturnType<typeof loadState>,
  patches: PatchOperation[],
): Promise<void> {
  const config = loadConfig();
  if (!config.narrativeEnabled || !config.narrativeInjectEnabled) return;

  const wb = await getFrameworkWorldbook();
  if (!wb) return;

  const templates = await getAllNarratives();
  const tpl = templates[0];
  if (!tpl) return;

  const lines: string[] = [];
  const currentState = loadState();

  for (const op of patches) {
    const path = typeof op.path === 'string' ? op.path : '';
    if (!path.startsWith('/')) continue;

    const seg = path.slice(1).split('/');
    if (seg.length === 0) continue;

    const key = seg.slice(seg[0] === 'characters' ? 2 : 1).join('/');
    const oldVal = _.get(preState, seg.join('.'));
    const newVal = _.get(currentState, seg.join('.'));
    const baseData = {
      key,
      old_value: formatNarrativeValue(oldVal),
      new_value: formatNarrativeValue(newVal),
      char_name: '',
      user_name: currentState._characters.char_user?.name || '用户',
    };

    if (seg[0] === 'shared') {
      lines.push(renderNarrativeLine(tpl.sharedTemplate, baseData));
      continue;
    }

    if (seg[0] === 'characters' && seg.length >= 2) {
      const charId = seg[1];
      const charName = currentState._characters[charId as any]?.name || charId;
      if (charId === 'char_user') {
        lines.push(renderNarrativeLine(tpl.userTemplate, { ...baseData, char_name: charName }));
      } else {
        lines.push(renderNarrativeLine(tpl.characterTemplate, { ...baseData, char_name: charName }));
      }
    }
  }

  const styleContent = tpl.stylePrompt?.trim() || '（未设置叙事风格指导）';
  const changeContent = lines.length > 0 ? lines.join('\n') : '本轮无可叙事的数据变化。';

  await updateWorldbookWith(WB_NAME, worldbook => {
    const next = [...worldbook];

    const styleIdx = next.findIndex(entry => entry.name === NARR_STYLE_ENTRY);
    const styleEntry = {
      name: NARR_STYLE_ENTRY,
      enabled: true,
      content: `【叙事风格指导】\n${styleContent}`,
      strategy: {
        type: 'constant',
        keys: [],
        keys_secondary: { logic: 'and_any', keys: [] },
        scan_depth: 'same_as_global',
      },
      position: {
        type: 'after_character_definition',
        role: 'system',
        depth: 4,
        order: 260,
      },
      probability: 100,
    } as any;

    const changeIdx = next.findIndex(entry => entry.name === NARR_CHANGES_ENTRY);
    const changeEntry = {
      name: NARR_CHANGES_ENTRY,
      enabled: true,
      content: `【本轮数据变化】\n${changeContent}`,
      strategy: {
        type: 'constant',
        keys: [],
        keys_secondary: { logic: 'and_any', keys: [] },
        scan_depth: 'same_as_global',
      },
      position: {
        type: 'after_character_definition',
        role: 'system',
        depth: 4,
        order: 261,
      },
      probability: 100,
    } as any;

    if (styleIdx >= 0) next[styleIdx] = { ...next[styleIdx], ...styleEntry };
    else next.push(styleEntry);

    if (changeIdx >= 0) next[changeIdx] = { ...next[changeIdx], ...changeEntry };
    else next.push(changeEntry);

    return next;
  });
}

async function clearNarrativeWorldbookEntries(): Promise<void> {
  const wb = await getFrameworkWorldbook();
  if (!wb) return;

  await updateWorldbookWith(WB_NAME, worldbook =>
    worldbook.map(entry => {
      if (entry.name === NARR_STYLE_ENTRY || entry.name === NARR_CHANGES_ENTRY) {
        return {
          ...entry,
          enabled: false,
          content: '',
        };
      }
      return entry;
    }),
  );
}

async function recoverStateByLatestSnapshotIfNeeded(): Promise<void> {
  const state = loadState();
  const currentCount = getChatMessages('0-{{lastMessageId}}', { hide_state: 'all' }).length;
  if (currentCount >= state._meta.message_count) return;

  const msgs = getChatMessages('0-{{lastMessageId}}', { hide_state: 'all' });
  let restored = false;
  for (let i = msgs.length - 1; i >= 0; i--) {
    const m = msgs[i];
    const snap = loadSnapshot(m.message_id);
    if (!snap) continue;

    const next = loadState();
    next.shared = _.cloneDeep(snap.shared);
    next.characters = _.cloneDeep(snap.characters);
    next._entry_meta = {};

    const oldChars = next._characters;
    next._characters = {} as any;
    for (const charId of Object.keys(next.characters)) {
      const name = oldChars[charId as any]?.name || (charId === 'char_user' ? '用户' : charId);
      next._characters[charId as any] = {
        char_id: charId as any,
        name,
        isPresent: oldChars[charId as any]?.isPresent ?? true,
      };
    }

    next._meta.message_count = currentCount;
    saveState(next);
    restored = true;
    break;
  }

  if (restored) {
    const config = loadConfig();
    if (!config.narrativeKeepOnRollback) {
      await clearNarrativeWorldbookEntries();
    }
    await renderStatusBar();
    toastr.warning('检测到楼层删除，已按最近快照回溯状态');
  } else {
    state._meta.message_count = currentCount;
    saveState(state);
    toastr.warning('检测到楼层删除，但未找到可用快照进行回溯');
  }
}

async function applyPatchFromAssistantMessage(messageId: number): Promise<void> {
  const message = getChatMessages(messageId, { role: 'assistant', hide_state: 'all' })[0];
  if (!message || typeof message.message !== 'string') return;

  const signature = makeSignature(messageId, message.message);
  if (processedSignature.has(signature)) return;

  const patches = extractPatchFromMessage(message.message);
  if (!patches || patches.length === 0) return;
  const normalizedPatches = normalizePatches(patches);

  const preState = loadState();
  const state = loadState();
  const result = mergePatches(state, normalizedPatches, { sourceId: messageId, isUserModification: false });

  if (result.applied <= 0) {
    processedSignature.add(signature);
    if (result.errors.length > 0) {
      console.warn(`[${SCRIPT_TITLE}] Patch 解析到但未应用:`, result.errors);
    }
    return;
  }

  const messageCount = getChatMessages('0-{{lastMessageId}}', { hide_state: 'all' }).length;
  updateMessageCount(state, messageCount);
  saveState(state);

  const snapshot = createSnapshot(state, normalizedPatches);
  saveSnapshot(snapshot, messageId);

  await syncNarrativeWorldbook(preState, normalizedPatches);

  processedSignature.add(signature);
  await renderStatusBar();
  toastr.success(`状态补丁已应用（${result.applied} 项）`, undefined, { timeOut: 1400 });
}

function handleUserMessageRendered(messageId: number): void {
  const state = loadState();
  degradePriority(state, messageId);
  saveState(state);
}

export function initPatchRuntime(): () => void {
  const stopReceived = eventOn(tavern_events.MESSAGE_RECEIVED, async (messageId, _type) => {
    await applyPatchFromAssistantMessage(messageId);
  });

  const stopUpdated = eventOn(tavern_events.MESSAGE_UPDATED, async messageId => {
    await applyPatchFromAssistantMessage(messageId);
  });

  const stopUserRendered = eventOn(tavern_events.USER_MESSAGE_RENDERED, messageId => {
    handleUserMessageRendered(messageId);
  });

  const stopChatChanged = eventOn(tavern_events.CHAT_CHANGED, () => {
    processedSignature.clear();
  });

  const stopDeleted = eventOn(tavern_events.MESSAGE_DELETED, async _messageId => {
    await recoverStateByLatestSnapshotIfNeeded();
  });

  return () => {
    stopReceived.stop();
    stopUpdated.stop();
    stopUserRendered.stop();
    stopChatChanged.stop();
    stopDeleted.stop();
  };
}
