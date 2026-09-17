"use client";

import { useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

const btn =
  "rounded-md border border-transparent px-2 py-1 text-sm leading-none text-slate-700 hover:bg-slate-100 enabled:hover:border-slate-200";

function TBtn({
  label,
  title,
  isActive,
  onToggle,
}: {
  label: React.ReactNode;
  title: string;
  isActive: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault();
        onToggle();
      }}
      className={`${btn} ${isActive ? "bg-slate-200 font-bold" : ""}`}
    >
      {label}
    </button>
  );
}

export default function RichTextEditor({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue?: string;
}) {
  const hiddenRef = useRef<HTMLTextAreaElement>(null);

  const editor = useEditor({
    extensions: [StarterKit],
    content: defaultValue ?? "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-[260px] max-h-[520px] overflow-y-auto px-4 py-3 text-sm leading-relaxed text-slate-800 focus:outline-none " +
          "[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:my-2 " +
          "[&_h2]:text-xl [&_h2]:font-bold [&_h2]:my-2 " +
          "[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:my-2 " +
          "[&_p]:my-1.5 " +
          "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-1.5 " +
          "[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-1.5 " +
          "[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-slate-300 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-slate-600 " +
          "[&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs " +
          "[&_pre]:my-2 [&_pre]:rounded-lg [&_pre]:bg-slate-900 [&_pre]:p-3 [&_pre]:text-slate-100 [&_pre]:text-xs [&_pre_code]:bg-transparent [&_pre_code]:p-0",
      },
    },
    onUpdate: ({ editor: e }) => {
      if (hiddenRef.current) hiddenRef.current.value = e.getHTML();
    },
  });

  if (!editor) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-300 bg-white">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-50 px-2 py-1.5">
        <TBtn
          label={<b>B</b>}
          title="Tučné"
          isActive={editor.isActive("bold")}
          onToggle={() => editor.chain().focus().toggleBold().run()}
        />
        <TBtn
          label={<i>I</i>}
          title="Kurzíva"
          isActive={editor.isActive("italic")}
          onToggle={() => editor.chain().focus().toggleItalic().run()}
        />
        <TBtn
          label={<s>S</s>}
          title="Prečiarknuté"
          isActive={editor.isActive("strike")}
          onToggle={() => editor.chain().focus().toggleStrike().run()}
        />
        <span className="mx-1 h-4 w-px bg-slate-300" />
        <TBtn
          label="H1"
          title="Nadpis 1"
          isActive={editor.isActive("heading", { level: 1 })}
          onToggle={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        />
        <TBtn
          label="H2"
          title="Nadpis 2"
          isActive={editor.isActive("heading", { level: 2 })}
          onToggle={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        />
        <TBtn
          label="H3"
          title="Nadpis 3"
          isActive={editor.isActive("heading", { level: 3 })}
          onToggle={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        />
        <span className="mx-1 h-4 w-px bg-slate-300" />
        <TBtn
          label="• Zoznam"
          title="Odrážkový zoznam"
          isActive={editor.isActive("bulletList")}
          onToggle={() => editor.chain().focus().toggleBulletList().run()}
        />
        <TBtn
          label="1. Zoznam"
          title="Číslovaný zoznam"
          isActive={editor.isActive("orderedList")}
          onToggle={() => editor.chain().focus().toggleOrderedList().run()}
        />
        <TBtn
          label="❝ Citát"
          title="Citát"
          isActive={editor.isActive("blockquote")}
          onToggle={() => editor.chain().focus().toggleBlockquote().run()}
        />
        <TBtn
          label="</>"
          title="Blok kódu"
          isActive={editor.isActive("codeBlock")}
          onToggle={() => editor.chain().focus().toggleCodeBlock().run()}
        />
        <span className="mx-1 h-4 w-px bg-slate-300" />
        <TBtn
          label="↺"
          title="Späť"
          isActive={false}
          onToggle={() => editor.chain().focus().undo().run()}
        />
        <TBtn
          label="↻"
          title="Znova"
          isActive={false}
          onToggle={() => editor.chain().focus().redo().run()}
        />
      </div>

      <EditorContent editor={editor} />

      <textarea
        ref={hiddenRef}
        name={name}
        className="hidden"
        defaultValue={defaultValue ?? ""}
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}