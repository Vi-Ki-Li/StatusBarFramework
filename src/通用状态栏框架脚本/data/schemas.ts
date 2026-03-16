/**
 * Zod 验证 Schema
 *
 * 用于验证 JSON Patch 操作和框架状态数据的完整性。
 * 运行时验证，防止 AI 返回无效数据。
 */

const PatchAddSchema = z.object({
  op: z.literal('add'),
  path: z.string().startsWith('/'),
  value: z.any(),
});

const PatchRemoveSchema = z.object({
  op: z.literal('remove'),
  path: z.string().startsWith('/'),
});

const PatchReplaceSchema = z.object({
  op: z.literal('replace'),
  path: z.string().startsWith('/'),
  value: z.any(),
});

const PatchMoveSchema = z.object({
  op: z.literal('move'),
  from: z.string().startsWith('/'),
  path: z.string().startsWith('/'),
});

const PatchCopySchema = z.object({
  op: z.literal('copy'),
  from: z.string().startsWith('/'),
  path: z.string().startsWith('/'),
});

const PatchTestSchema = z.object({
  op: z.literal('test'),
  path: z.string().startsWith('/'),
  value: z.any(),
});

/** 单个 JSON Patch 操作的 schema */
export const PatchOperationSchema = z.discriminatedUnion('op', [
  PatchAddSchema,
  PatchRemoveSchema,
  PatchReplaceSchema,
  PatchMoveSchema,
  PatchCopySchema,
  PatchTestSchema,
]);

/** JSON Patch 文档（操作数组） */
export const PatchDocumentSchema = z.array(PatchOperationSchema);

/** 角色 ID 格式验证 */
export const CharIdSchema = z.string().regex(/^char_.+$/, '角色 ID 必须以 "char_" 开头');

/** 条目元信息 schema */
export const EntryMetaSchema = z.object({
  source_id: z.number().int(),
  user_modified: z.boolean(),
});

/** 角色信息 schema */
export const CharacterInfoSchema = z.object({
  char_id: CharIdSchema,
  name: z.string().min(1),
  isPresent: z.boolean(),
});

/** 状态元数据 schema */
export const StateMetaSchema = z.object({
  message_count: z.number().int().min(0),
  version: z.number().int().positive(),
});

/** 框架状态 schema（宽松模式，shared 和 characters 内容不验证） */
export const FrameworkStateSchema = z.object({
  _meta: StateMetaSchema,
  _characters: z.record(z.string(), CharacterInfoSchema),
  shared: z.record(z.string(), z.any()),
  characters: z.record(z.string(), z.record(z.string(), z.any())),
  _entry_meta: z.record(z.string(), EntryMetaSchema),
});
