import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, FabricObject, Image as FabricImage, Rect } from 'fabric';

type ScaleMode = 'contain' | 'cover';

const config = {
  template_width: 3000.0,
  template_height: 3000.0,
  print_area_width: 1429.0,
  print_area_height: 1809.0,
  print_area_top: 464.0,
  print_area_left: 801.0,
} as const;

function createPrintAreaClipPath() {
  return new Rect({
    left: config.print_area_left,
    top: config.print_area_top,
    width: config.print_area_width,
    height: config.print_area_height,
    absolutePositioned: true,
  });
}

export default function DesignStudio() {
  const [scaleMode, setScaleMode] = useState<ScaleMode>('contain');

  const stageElRef = useRef<HTMLDivElement | null>(null);
  const canvasElRef = useRef<HTMLCanvasElement | null>(null);

  const canvasRef = useRef<Canvas | null>(null);
  const bgImageInstanceRef = useRef<FabricImage | null>(null);
  const printAreaClipPathRef = useRef<Rect | null>(null);

  const updateBackground = useCallback(() => {
    const canvas = canvasRef.current;
    const bgImage = bgImageInstanceRef.current;
    if (!canvas || !bgImage) return;

    const ratioW = config.template_width / bgImage.width!;
    const ratioH = config.template_height / bgImage.height!;
    const scale = scaleMode === 'contain' ? Math.min(ratioW, ratioH) : Math.max(ratioW, ratioH);

    bgImage.set({
      scaleX: scale,
      scaleY: scale,
      left: config.template_width / 2,
      top: config.template_height / 2,
      originX: 'center',
      originY: 'center',
      selectable: false,
      hoverCursor: 'default',
    });

    canvas.renderAll();
  }, [scaleMode]);

  const resizeAndScaleStudio = useCallback(() => {
    const canvas = canvasRef.current;
    const stageEl = stageElRef.current;
    if (!canvas || !stageEl) return;

    const padding = 30;
    const availableWidth = stageEl.clientWidth - padding;
    const availableHeight = stageEl.clientHeight - padding;

    const scaleMultiplier = Math.min(
      availableWidth / config.template_width,
      availableHeight / config.template_height,
    );

    canvas.setDimensions({
      width: config.template_width * scaleMultiplier,
      height: config.template_height * scaleMultiplier,
    });

    canvas.setZoom(scaleMultiplier);
    canvas.renderAll();
  }, []);

  useEffect(() => {
    const canvasEl = canvasElRef.current;
    if (!canvasEl) return;

    const canvas = new Canvas(canvasEl, {
      backgroundColor: 'rgba(0,0,0,0)',
      controlsAboveOverlay: true,
      preserveObjectStacking: true,
    });

    canvasRef.current = canvas;

    const printAreaClipPath = createPrintAreaClipPath();
    printAreaClipPathRef.current = printAreaClipPath;

    const afterRenderHandler = (e: { ctx?: CanvasRenderingContext2D }) => {
      const ctx = e.ctx;
      if (!ctx) return;

      ctx.save();
      ctx.strokeStyle = '#dc3545';
      ctx.lineWidth = 8;
      ctx.setLineDash([20, 15]);
      ctx.strokeRect(
        config.print_area_left,
        config.print_area_top,
        config.print_area_width,
        config.print_area_height,
      );

      ctx.fillStyle = '#dc3545';
      ctx.font = 'bold 44px sans-serif';
      ctx.setLineDash([]);
      ctx.fillText(
        'PRINT AREA BOUNDARY',
        config.print_area_left + 30,
        config.print_area_top + 65,
      );
      ctx.restore();
    };

    canvas.on('after:render', afterRenderHandler);

    const onResize = () => resizeAndScaleStudio();
    window.addEventListener('resize', onResize);

    resizeAndScaleStudio();

    return () => {
      window.removeEventListener('resize', onResize);
      canvas.off('after:render', afterRenderHandler);
      canvas.dispose();

      canvasRef.current = null;
      bgImageInstanceRef.current = null;
      printAreaClipPathRef.current = null;
    };
  }, [resizeAndScaleStudio]);

  useEffect(() => {
    updateBackground();
  }, [updateBackground]);

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });

  const handleBgUpload = async (file: File | null) => {
    const canvas = canvasRef.current;
    if (!canvas || !file) return;

    const dataUrl = await readFileAsDataUrl(file);
    const img = await FabricImage.fromURL(dataUrl);

    if (bgImageInstanceRef.current) {
      canvas.remove(bgImageInstanceRef.current);
    }

    bgImageInstanceRef.current = img;

    // Put background at the bottom z-order
    canvas.insertAt(0, img);

    updateBackground();
  };

  const handleArtworkUpload = async (file: File | null) => {
    const canvas = canvasRef.current;
    const printAreaClipPath = printAreaClipPathRef.current;
    if (!canvas || !printAreaClipPath || !file) return;

    const dataUrl = await readFileAsDataUrl(file);
    const img = await FabricImage.fromURL(dataUrl);

    const ratioW = (config.print_area_width * 0.8) / img.width!;
    const ratioH = (config.print_area_height * 0.8) / img.height!;
    const initialScale = Math.min(ratioW, ratioH, 1.0);

    img.set({
      left: config.print_area_left + config.print_area_width / 2,
      top: config.print_area_top + config.print_area_height / 2,
      originX: 'center',
      originY: 'center',
      scaleX: initialScale,
      scaleY: initialScale,
      cornerColor: '#007bff',
      cornerSize: 36,
      transparentCorners: false,
      borderColor: '#007bff',
      borderScaleFactor: 4,
      clipPath: printAreaClipPath,
    });

    canvas.add(img);
    canvas.setActiveObject(img);
    canvas.renderAll();
  };

  const handleExportClick = async () => {
    const canvas = canvasRef.current;
    const bgImageInstance = bgImageInstanceRef.current;
    if (!canvas || !bgImageInstance) return;

    // Create an export-time clipPath that isn't tied to the main canvas objects.
    const exportClipPath = createPrintAreaClipPath();

    canvas.discardActiveObject();
    canvas.renderAll();

    const hiddenCanvasEl = document.createElement('canvas');
    const offscreenCanvas = new Canvas(hiddenCanvasEl, {
      width: config.template_width,
      height: config.template_height,
      backgroundColor: 'rgba(0,0,0,0)',
    });

    const targetObjects = canvas.getObjects().filter((obj) => obj !== bgImageInstance) as FabricObject[];

    await Promise.all(
      targetObjects.map(async (obj) => {
        const clonedObj = await obj.clone();
        clonedObj.clipPath = exportClipPath;
        offscreenCanvas.add(clonedObj);
      }),
    );

    offscreenCanvas.renderAll();

    const dataURL = offscreenCanvas.toDataURL({
      format: 'png',
      left: 0,
      top: 0,
      width: config.template_width,
      height: config.template_height,
      multiplier: 1,
    });

    offscreenCanvas.dispose();

    const downloadLink = document.createElement('a');
    downloadLink.download = `template-snapshot-${Date.now()}.png`;
    downloadLink.href = dataURL;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className="app-container">
      <div className="controls">
        <div className="control-group">
          <label htmlFor="bgLoader">1. Template Background</label>
          <input
            id="bgLoader"
            type="file"
            accept="image/*"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              void handleBgUpload(e.target.files?.[0] ?? null)
            }
          />
        </div>

        <div className="control-group">
          <label htmlFor="artworkLoader">2. Interactive Artwork</label>
          <input
            id="artworkLoader"
            type="file"
            accept="image/*"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              void handleArtworkUpload(e.target.files?.[0] ?? null)
            }
          />
        </div>

        <div className="control-group">
          <label htmlFor="scaleMode">BG Scale Mode</label>
          <select
            id="scaleMode"
            value={scaleMode}
            onChange={(e) => setScaleMode(e.target.value as ScaleMode)}
          >
            <option value="contain">Contain (Fit)</option>
            <option value="cover">Cover (Fill)</option>
          </select>
        </div>

        <button className="export-btn" type="button" onClick={() => void handleExportClick()}>
          Export Full Template Snapshot
        </button>
      </div>

      <div className="workspace-stage" id="stage" ref={stageElRef}>
        <div className="canvas-container">
          <canvas id="productCanvas" ref={canvasElRef} />
        </div>
      </div>
    </div>
  );
}
