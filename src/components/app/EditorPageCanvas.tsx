import { createSignal, createEffect, on, onMount, onCleanup } from "solid-js";
import { THUMBNAIL_INTERSECTION_MARGIN, THUMBNAIL_SCALE } from "../../constants";
import type { PageState } from "../../types/interfaces";
import { pdfService } from "../../services/pdf-service";

interface Props {
  page: PageState;
  rotation: number;
  scrollRoot: HTMLDivElement;
}

export default function EditorPageCanvas(props: Props) {
  const [renderState, setRenderState] = createSignal<"loading" | "ready" | "error">("loading");
  const [rendered, setRendered] = createSignal(false);

  // Solid.js refs are assigned via JSX ref attribute
  // eslint-disable-next-line no-unassigned-vars
  let container!: HTMLDivElement;
  // eslint-disable-next-line no-unassigned-vars
  let canvas!: HTMLCanvasElement;

  // Landscape when rotated 90° or 270°
  const isTransposed = () => props.rotation % 180 !== 0;

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
            // pdf.js rotation is CCW; CSS/UI rotation is CW — convert direction
            const pdfjsRotation = (360 - props.rotation) % 360;
            await pdfService.renderPage(
              props.page.sourcePageNumber,
              canvas,
              THUMBNAIL_SCALE,
              pdfjsRotation
            );
            if (!container.isConnected) return;
            container.classList.remove("thumbnail-placeholder");
            setRenderState("ready");
            setRendered(true);
          } catch (err) {
            console.error(`Failed to render page ${props.page.sourcePageNumber}:`, err);
            if (container.isConnected) container.classList.remove("thumbnail-placeholder");
            setRenderState("error");
          }
        }
      },
      {
        root: props.scrollRoot,
        rootMargin: THUMBNAIL_INTERSECTION_MARGIN,
        threshold: 0,
      }
    );

    observer.observe(container);

    onCleanup(() => {
      canvas.width = 0;
      observer.disconnect();
    });
  });

  // Re-render when rotation changes after the first viewport render.
  // `defer: true` prevents this from firing on initial mount — the IntersectionObserver
  // already renders with the correct rotation on first entry.
  createEffect(
    on(
      () => props.rotation,
      async (rotation) => {
        if (!rendered()) return;
        try {
          const storedPassword = pdfService.getPassword(props.page.sourceFile);
          if (storedPassword !== undefined) {
            await pdfService.loadPDFWithPassword(props.page.sourceFile, storedPassword);
          } else {
            await pdfService.loadPDF(props.page.sourceFile);
          }
          if (!container.isConnected) return;
          const pdfjsRotation = (360 - rotation) % 360;
          await pdfService.renderPage(
            props.page.sourcePageNumber,
            canvas,
            THUMBNAIL_SCALE,
            pdfjsRotation
          );
        } catch (err) {
          console.error(`Failed to re-render rotated page:`, err);
        }
      },
      { defer: true }
    )
  );

  return (
    <div
      ref={container}
      data-testid="editor-page-canvas"
      data-render-state={renderState()}
      class="canvas-container thumbnail-placeholder"
      style={{ "aspect-ratio": isTransposed() ? "4/3" : "3/4" }}
    >
      <canvas ref={canvas} class="page-canvas" />
    </div>
  );
}
