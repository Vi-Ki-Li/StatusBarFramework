# 仓库 JSON 快速导入手册（SillyTavern 状态栏框架）

## 目标

把仓库中的测试 JSON 快速导入到当前接管浏览器页面，减少“手工逐个点导入”。

## 适用 JSON 契约

系统配置-备份导入接受的顶层结构（来自 `FullExport`）：

```json
{
  "_omg_export": true,
  "version": 1,
  "timestamp": 1700000000000,
  "definitions": { "version": 1, "categories": [], "entries": [] },
  "styles": { "version": 1, "units": [], "globalTheme": { "css": "", "htmlTemplate": "" } },
  "layouts": { "version": 1, "layouts": [] },
  "themes": { "version": 1, "themes": [] },
  "narratives": { "version": 1, "templates": [] }
}
```

可直接复用仓库示例：

- `docs/test-data/statusbar-fixtures-minimal/good/full-export.json`

## 链路 1（优先）：文件输入控件直传

1. 打开管理器，进入“系统配置 > 备份与迁移”。
2. 定位导入文件 input（通常是隐藏的 `<input type="file">`）。
3. 使用 MCP 的 `upload_file` 把仓库 JSON 直接喂给该 input。
4. 截图并记录导入结果 toast。

适配建议：

- 若有多个 file input，优先选择“导入数据”区域下最近的 input。
- 上传后等待成功 toast，再执行后续模块截图。

## 链路 2：临时静态服务 + 页面 fetch

适用于“希望页面自己拉取仓库 JSON，而不是上传本地文件”。

### 2.1 在工作区开一个临时静态服务

在工作区根目录执行：

```powershell
python -m http.server 8012
```

### 2.2 在页面控制台执行导入脚本（fetch + IndexedDB 写入）

```js
(async () => {
  const url = 'http://127.0.0.1:8012/docs/test-data/statusbar-fixtures-minimal/good/full-export.json';
  const data = await fetch(url).then(r => {
    if (!r.ok) throw new Error(`fetch failed: ${r.status}`);
    return r.json();
  });

  if (!data || data._omg_export !== true) {
    throw new Error('无效导入文件：缺少 _omg_export=true');
  }

  const DB_NAME = 'omg-status-bar-framework';
  const DB_VERSION = 1;
  const STORE_NAMES = ['definitions', 'styles', 'layouts', 'themes', 'narratives'];

  const db = await new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  const tx = db.transaction(STORE_NAMES, 'readwrite');

  const clearStore = storeName => new Promise((resolve, reject) => {
    const req = tx.objectStore(storeName).clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });

  const putMany = (storeName, items) => {
    const store = tx.objectStore(storeName);
    for (const item of items || []) store.put(item);
  };

  if (data.definitions) {
    await clearStore('definitions');
    putMany('definitions', [...(data.definitions.categories || []), ...(data.definitions.entries || [])]);
  }

  if (data.styles) {
    await clearStore('styles');
    putMany('styles', data.styles.units || []);
    if (data.styles.globalTheme) {
      tx.objectStore('styles').put({
        id: '_global_theme_',
        css: data.styles.globalTheme.css || '',
        htmlTemplate: data.styles.globalTheme.htmlTemplate || '',
      });
    }
  }

  if (data.layouts) {
    await clearStore('layouts');
    putMany('layouts', data.layouts.layouts || []);
  }

  if (data.themes) {
    await clearStore('themes');
    putMany('themes', data.themes.themes || []);
  }

  if (data.narratives) {
    await clearStore('narratives');
    putMany('narratives', data.narratives.templates || []);
  }

  await new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  const readCount = storeName => new Promise((resolve, reject) => {
    const rtx = db.transaction(storeName, 'readonly');
    const req = rtx.objectStore(storeName).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  console.table({
    definitions: await readCount('definitions'),
    styles: await readCount('styles'),
    layouts: await readCount('layouts'),
    themes: await readCount('themes'),
    narratives: await readCount('narratives'),
  });

  db.close();
  console.info('[omg-import] done, 请刷新管理器或重新打开系统配置确认可见性');
})();
```

## 链路 3：直接粘贴 JSON 对象 + IndexedDB 写入（兜底）

适用于无法开静态服务或页面无法 fetch 本地地址。

1. 把 JSON 内容粘贴到 `const data = {...}`。
2. 复用上面脚本，去掉 `fetch` 部分。
3. 执行后打印五个 store count，并截图控制台结果。

## 导入后强制核验

1. 五个 store count 已输出并截图。
2. 管理器“系统配置 > 备份与迁移”页截图（导入后）。
3. 本轮目标模块截图（before/after）。
4. 若涉及主题/布局，补充截图当前主题组合和布局下拉项。

## 常见失败与处理

1. 报“无效的备份文件”
   - 检查 `_omg_export` 是否为 `true`。
2. 导入后看不到 tabs 或布局异常
   - 先核对 `themes/layouts` 的 count，再做运行时事件取证。
3. 执行脚本报 `VersionError` 或 transaction 失败
   - 关闭旧页面后重开；确保同源下只有一个目标页面在写同一 DB。
