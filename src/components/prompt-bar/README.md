# PromptBar Component

A premium 2-row AI composer with auto-expanding textarea, `@` sources, `/` commands, model selector, shadcn attachments with image previews & popup lightbox, file validation, dictation, and Glimm rainbow celebration.

## 1. Import

```tsx
import { PromptBar, type PromptBarProps, type AttachedFile, type Model } from "@/components/PromptBar";
```

## 2. Props Reference

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `value` / `defaultValue` | `string` | — | Controlled or uncontrolled text |
| `onValueChange` | `(text) => void` | — | Fired when text changes |
| `onSend` | `(text, files, model) => void`| — | Fired on Enter or Send click |
| `placeholder` / `autoFocus` | `string` / `boolean` | — | Textarea placeholder / autoFocus |
| `disabled` / `loading` | `boolean` | `false` | Disabled state / spinner on send |
| `variant` | `"Rounded" \| "Pill"` | `"Rounded"` | Outer rounding style |
| `models` / `model` / `defaultModel` | `Model[]` / `Model \| string` | — | Models list / controlled / default model |
| `onModelChange` / `hideModelPicker` | `(model) => void` / `boolean` | — | Model change event / toggle visibility |
| `sources` / `commands` | `Source[]` / `Command[]` | — | Custom `@` mentions / `/` commands |
| `hideAttachments` / `hideDictation` | `boolean` | `false` | Hide `+` button / microphone |
| `attachments` / `onAttachmentsChange`| `AttachedFile[]` / `(files) => void` | — | Controlled attachments list & event |
| `maxFiles` | `number` | `6` | Maximum number of attached files |
| `acceptedFileTypes` | `string` | `"image/*,.pdf,.svg,application/pdf"` | Allowed file types (MIME or ext) |
| `maxFileSize` | `number` | `10485760` (10MB) | Maximum file size in bytes |
| `onFileError` | `(err) => void` | — | Fired when file fails type, size, or count check |
| `className` / `composerClassName` | `string` | — | Styling class overrides |

## 3. Usage Examples

### A. File Limits (Max 6 Files, Size, Format) & Image Lightbox
Attachments automatically render using shadcn `Attachment` components with image thumbnails, file format badges (`PNG`, `SVG`, `PDF`), and file sizes. Clicking any image thumbnail opens a full-screen preview popup lightbox with backdrop blur.

```tsx
<PromptBar
  maxFiles={6} // Limit to 6 attachments
  acceptedFileTypes="image/*,.svg,.pdf"
  maxFileSize={10 * 1024 * 1024} // 10MB limit
  onFileError={(errorMsg) => console.warn(errorMsg)}
  onSend={(text, files, model) => {
    // files: AttachedFile[] with name, size, type, url, and rawFile
    console.log("Attached files:", files);
  }}
/>
```

### B. Standard Chat Interface
```tsx
const [input, setInput] = useState("");
const [loading, setLoading] = useState(false);

<PromptBar
  value={input}
  onValueChange={setInput}
  loading={loading}
  onSend={async (text, files, model) => {
    setLoading(true);
    await postMessage({ text, files, model: model?.key });
    setLoading(false);
  }}
/>
```

### C. Custom Models & Glimm Rainbow Sweep
```tsx
const MODELS: Model[] = [
  { key: "claude-3-7-sonnet", name: "Claude 3.7 Sonnet", tag: "Flagship" },
  { key: "gpt-4o", name: "GPT-4o", tag: "General" },
];

<PromptBar
  models={MODELS}
  defaultModel="claude-3-7-sonnet"
  onModelChange={(m) => console.log("Selected:", m.name)}
/>
```

### D. Custom Sources (`@`) & Commands (`/`)
```tsx
<PromptBar
  sources={[
    { key: "catalog", name: "Catalog", desc: "Products & collections" },
    { key: "theme", name: "Theme Files", desc: "Liquid templates & CSS" },
  ]}
  commands={[
    { key: "sync", name: "/sync", desc: "Sync catalog to vector DB" },
    { key: "publish", name: "/publish", desc: "Deploy changes to live store" },
  ]}
/>
```

## 4. Keyboard Shortcuts

- <kbd>@</kbd> / <kbd>/</kbd>: Opens sources mention or slash command popup.
- <kbd>↑</kbd> / <kbd>↓</kbd>: Navigates items with auto-scroll; <kbd>Enter</kbd> / <kbd>Tab</kbd>: Selects item.
- <kbd>Esc</kbd>: Closes any open popup or image preview dialog.
- <kbd>Enter</kbd>: Submits prompt (<kbd>Shift</kbd>+<kbd>Enter</kbd> inserts a newline).
