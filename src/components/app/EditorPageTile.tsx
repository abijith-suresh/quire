import type { PageState } from "../../types/interfaces";
import EditorPageCanvas from "./EditorPageCanvas";

interface Props {
  page: PageState;
  index: number;
  selected: boolean;
  isDragSource: boolean;
  dragOverDirection: "before" | "after" | null;
  scrollRoot: HTMLDivElement;
  onClick: () => void;
  onRotate: (e: MouseEvent) => void;
  onDragStart: (e: DragEvent) => void;
  onDragOver: (e: DragEvent) => void;
  onDragEnter: (e: DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: DragEvent) => void;
  onDragEnd: () => void;
}

export default function EditorPageTile(props: Props) {
  const tileClass = () => {
    const classes = ["editor-page"];
    if (props.selected) classes.push("selected");
    if (props.page.markedForDeletion) classes.push("marked-deleted");
    if (props.isDragSource) classes.push("dragging");
    if (props.dragOverDirection === "before") classes.push("drag-insert-before");
    if (props.dragOverDirection === "after") classes.push("drag-insert-after");
    return classes.join(" ");
  };

  return (
    <div
      class={tileClass()}
      draggable={true}
      tabindex="0"
      role="option"
      aria-selected={props.selected}
      aria-label={
        props.page.markedForDeletion
          ? `Page ${props.index + 1}, marked for deletion`
          : `Page ${props.index + 1}`
      }
      onClick={props.onClick}
      onDragStart={props.onDragStart}
      onDragOver={props.onDragOver}
      onDragEnter={props.onDragEnter}
      onDragLeave={props.onDragLeave}
      onDrop={props.onDrop}
      onDragEnd={props.onDragEnd}
    >
      <EditorPageCanvas
        page={props.page}
        rotation={props.page.rotation}
        scrollRoot={props.scrollRoot}
      />
      <div class="page-controls">
        <span class="page-label">Page {props.index + 1}</span>
        <button
          class="btn-page-rotate"
          title="Rotate 90°"
          aria-label="Rotate page 90 degrees"
          onClick={props.onRotate}
        >
          &#x21BB;
        </button>
      </div>
    </div>
  );
}
