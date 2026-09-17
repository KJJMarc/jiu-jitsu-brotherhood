"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { useEffect, useState } from "react";
import styles from "./rich-text.module.css";

function ToolbarButton({
  onClick,
  active,
  children,
  label,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      className={`${styles.toolbarBtn}${active ? ` ${styles.toolbarBtnActive}` : ""}`}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}

function Toolbar({
  editor,
  onInsertImage,
}: {
  editor: Editor;
  onInsertImage: () => void;
}) {
  return (
    <div className={styles.toolbar} role="toolbar" aria-label="Formatting">
      <ToolbarButton
        label="Paragraph"
        active={editor.isActive("paragraph")}
        onClick={() => editor.chain().focus().setParagraph().run()}
      >
        P
      </ToolbarButton>
      <ToolbarButton
        label="Heading 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        label="Heading 3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        H3
      </ToolbarButton>
      <span className={styles.toolbarSep} aria-hidden="true" />
      <ToolbarButton
        label="Bold"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        B
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        I
      </ToolbarButton>
      <ToolbarButton
        label="Underline"
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        U
      </ToolbarButton>
      <span className={styles.toolbarSep} aria-hidden="true" />
      <ToolbarButton
        label="Bullet list"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        • List
      </ToolbarButton>
      <ToolbarButton
        label="Numbered list"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1. List
      </ToolbarButton>
      <ToolbarButton
        label="Quote"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        Quote
      </ToolbarButton>
      <span className={styles.toolbarSep} aria-hidden="true" />
      <ToolbarButton
        label="Link"
        active={editor.isActive("link")}
        onClick={() => {
          const previous = editor.getAttributes("link").href as
            | string
            | undefined;
          const url = window.prompt("Link URL", previous ?? "https://");
          if (url === null) return;
          if (url.trim() === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
          }
          editor
            .chain()
            .focus()
            .extendMarkRange("link")
            .setLink({ href: url.trim() })
            .run();
        }}
      >
        Link
      </ToolbarButton>
      <ToolbarButton label="Image" onClick={onInsertImage}>
        Image
      </ToolbarButton>
      <ToolbarButton
        label="Divider"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        —
      </ToolbarButton>
    </div>
  );
}

export default function RichTextEditor({
  name,
  initialHtml,
  imageOptions,
  placeholder = "Write the article…",
}: {
  name: string;
  initialHtml: string;
  imageOptions: string[];
  placeholder?: string;
}) {
  const [html, setHtml] = useState(initialHtml || "<p></p>");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [filter, setFilter] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer" },
      }),
      Image.configure({
        HTMLAttributes: { class: styles.inlineImage },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: initialHtml || "<p></p>",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: styles.prose,
      },
    },
    onUpdate: ({ editor: current }) => {
      setHtml(current.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const next = initialHtml || "<p></p>";
    if (editor.getHTML() !== next) {
      editor.commands.setContent(next, { emitUpdate: false });
      setHtml(next);
    }
  }, [editor, initialHtml]);

  const filtered = imageOptions.filter((src) =>
    src.toLowerCase().includes(filter.trim().toLowerCase()),
  );

  return (
    <div className={styles.shell}>
      <input type="hidden" name={name} value={html} />
      {editor ? (
        <Toolbar
          editor={editor}
          onInsertImage={() => {
            setFilter("");
            setPickerOpen(true);
          }}
        />
      ) : null}
      <EditorContent editor={editor} className={styles.editorSurface} />

      {pickerOpen ? (
        <div
          className={styles.dialogBackdrop}
          role="presentation"
          onClick={() => setPickerOpen(false)}
        >
          <div
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-label="Insert image"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.dialogHeader}>
              <h3>Insert image</h3>
              <button
                type="button"
                className={styles.dialogClose}
                onClick={() => setPickerOpen(false)}
              >
                Close
              </button>
            </div>
            <p className={styles.dialogHint}>
              Choose an existing <code>/images/news/…</code> asset. Uploads are
              not enabled yet.
            </p>
            <input
              type="search"
              className={styles.dialogSearch}
              placeholder="Filter images"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            />
            <div className={styles.dialogGrid}>
              {filtered.map((src) => (
                <button
                  key={src}
                  type="button"
                  className={styles.dialogThumb}
                  onClick={() => {
                    editor?.chain().focus().setImage({ src, alt: "" }).run();
                    setPickerOpen(false);
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" />
                  <span>{src.replace("/images/news/", "")}</span>
                </button>
              ))}
              {filtered.length === 0 ? (
                <p className={styles.dialogEmpty}>No images match.</p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
