import { onMount, onCleanup } from "solid-js";
import type { PageState } from "../../types/interfaces";
import { pdfService } from "../../services/pdf-service";

interface Props {
  page: PageState;
  rotation: number;
  scrollRoot: HTMLDivElement;
}

export default function EditorPageCanvas(props: Props) {
  // Solid.js refs are assigned via JSX ref attribute
  // eslint-disable-next-line no-unassigned-vars
  let container!: HTMLDivElement;
  // eslint-disable-next-line no-unassigned-vars
  let canvas!: HTMLCanvasElement;

  onMount(() => {
    const observer = new IntersectionObserver(
      async (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.disconnect();

          try {
            const storedPassword = pdfService.getPassword(props.page.sourceFile);
            if (storedPassword !== undefined) {
              await pdfService.loadPDFWithPassword(props.page.sourceFile, storedPassword);
            } else {
              await pdfService.loadPDF(props.page.sourceFile);
            }
            if (!container.isConnected) return;
            await pdfService.renderPage(props.page.sourcePageNumber, canvas, 0.5);
            if (!container.isConnected) return;
            container.classList.remove("thumbnail-placeholder");
          } catch (err) {
            console.error(`Failed to render page ${props.page.sourcePageNumber}:`, err);
            if (container.isConnected) container.classList.remove("thumbnail-placeholder");
          }
        }
      },
      {
        root: props.scrollRoot,
        rootMargin: "200px",
        threshold: 0,
      }
    );

    observer.observe(container);

    onCleanup(() => {
      canvas.width = 0;
      observer.disconnect();
    });
  });

  return (
    <div
      ref={container}
      class="canvas-container thumbnail-placeholder"
      style={{ transform: `rotate(${props.rotation}deg)` }}
    >
      <canvas ref={canvas} class="page-canvas" />
    </div>
  );
}
