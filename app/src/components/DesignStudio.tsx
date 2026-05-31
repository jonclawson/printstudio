import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Canvas, FabricObject, Image as FabricImage, Rect } from 'fabric';
import type { TemplateConfig } from '../types/template';

type FabricCanvasRef = React.MutableRefObject<Canvas | null>;

export default function DesignStudio({ config }: { config: TemplateConfig }) {
  const canvasElRef = useRef<HTMLCanvasElement | null>(null);
  const stageElRef = useRef<HTMLDivElement | null>(null);

  const canvasRef: FabricCanvasRef = useRef<Canvas | null>(null);
  const bgImageRef = useRef<FabricImage | null>(null);
  const fileInputArtworkRef = useRef<HTMLInputElement | null>(null);

  const templateDims = useMemo(
    () => ({
      width: config.template_width,
      height: config.template_height,
    }),
    [config.template_width, config.template_height],
  );

  const printAreaClipPath = useCallback(() => {
    return new Rect({
      left: config.print_area_left,
      top: config.print_area_top,
      width: config.print_area_width,
      height: config.print_area_height,
      absolutePositioned: true,
      originX: 'left',
      originY: 'top',
    });
  }, [
    config.print_area_left,
    config.print_area_top,
    config.print_area_width,
    config.print_area_height,
  ]);

  const resizeAndScaleStudio = useCallback(() => {
    const canvas = canvasRef.current;
    const stageEl = stageElRef.current;
    if (!canvas || !stageEl) return;

    const padding = 30;
    const availableWidth = stageEl.clientWidth - padding;
    const availableHeight = stageEl.clientHeight - padding;

    const scaleMultiplier = Math.min(
      availableWidth / templateDims.width,
      availableHeight / templateDims.height,
    );

    canvas.setDimensions({
      width: templateDims.width * scaleMultiplier,
      height: templateDims.height * scaleMultiplier,
    });

    canvas.setZoom(scaleMultiplier);
    canvas.renderAll();
  }, [templateDims.height, templateDims.width]);

  const drawPrintAreaGuidelines = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.off('after:render'); // keep handler idempotent

    canvas.on('after:render', (options: { ctx?: CanvasRenderingContext2D }) => {
      const ctx = options.ctx;
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
    });
  }, [
    config.print_area_height,
    config.print_area_left,
    config.print_area_top,
    config.print_area_width,
  ]);

  const readFileAsDataUrl = useCallback((file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
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

    resizeAndScaleStudio();
    drawPrintAreaGuidelines();

    const onResize = () => resizeAndScaleStudio();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      canvas.off('after:render');
      canvas.dispose();

      canvasRef.current = null;
      bgImageRef.current = null;
    };
  }, [drawPrintAreaGuidelines, resizeAndScaleStudio]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const cancelledRef = { cancelled: false };

    const loadBg = async () => {
      const nextBg = await FabricImage.fromURL(config.image_url);

      if (cancelledRef.cancelled) {
        nextBg.dispose();
        return;
      }

      if (bgImageRef.current) {
        canvas.remove(bgImageRef.current);
        bgImageRef.current.dispose();
      }

      // Fit background into template area (contain only).
      const ratioW = templateDims.width / (nextBg.width ?? 1);
      const ratioH = templateDims.height / (nextBg.height ?? 1);
      const scale = Math.min(ratioW, ratioH);

      nextBg.set({
        scaleX: scale,
        scaleY: scale,
        left: templateDims.width / 2,
        top: templateDims.height / 2,
        originX: 'center',
        originY: 'center',
        selectable: false,
        hoverCursor: 'default',
      });

      bgImageRef.current = nextBg;

      canvas.insertAt(0, nextBg);
      canvas.renderAll();
    };

    void loadBg();

    return () => {
      cancelledRef.cancelled = true;
    };
  }, [config.image_url, templateDims.height, templateDims.width]);

  const handleArtworkFile = useCallback(
    async (file: File | null) => {
      const canvas = canvasRef.current;
      const areaClip = printAreaClipPath();
      if (!canvas || !file) return;

      const dataUrl = await readFileAsDataUrl(file);
      const img = await FabricImage.fromURL(dataUrl);

      const ratioW = (config.print_area_width * 0.8) / (img.width ?? 1);
      const ratioH = (config.print_area_height * 0.8) / (img.height ?? 1);
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
        clipPath: areaClip,
      });

      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
    },
    [
      config.print_area_height,
      config.print_area_left,
      config.print_area_top,
      config.print_area_width,
      printAreaClipPath,
      readFileAsDataUrl,
    ],
  );

  const handleUploadArtworkClick = useCallback(() => {
    fileInputArtworkRef.current?.click();
  }, []);

  const handleExportClick = useCallback(async () => {
    const canvas = canvasRef.current;
    const bgImageInstance = bgImageRef.current;
    if (!canvas || !bgImageInstance) return;

    canvas.discardActiveObject();
    canvas.renderAll();

    const offscreenEl = document.createElement('canvas');
    const offscreenCanvas = new Canvas(offscreenEl, {
      width: templateDims.width,
      height: templateDims.height,
      backgroundColor: 'rgba(0,0,0,0)',
    });

    const exportClip = printAreaClipPath();

    const targetObjects = canvas
      .getObjects()
      .filter((obj) => obj !== bgImageInstance) as FabricObject[];

    await Promise.all(
      targetObjects.map(async (obj) => {
        const clonedObj = await obj.clone();
        clonedObj.clipPath = exportClip;
        offscreenCanvas.add(clonedObj);
      }),
    );

    offscreenCanvas.renderAll();

    // Crop export to the print area bounds
    const dataURL = offscreenCanvas.toDataURL({
      format: 'png',
      left: config.print_area_left,
      top: config.print_area_top,
      width: config.print_area_width,
      height: config.print_area_height,
      multiplier: 1,
    });

    offscreenCanvas.dispose();

    // If the parent provided a callback, pass the export as a File.
    // (Prefer callback over auto-download.)
    if (config.onExportComplete) {
      const res = await fetch(dataURL);
      const blob = await res.blob();
      const file = new File([blob], `print-area-${Date.now()}.png`, {
        type: 'image/png',
      });
      await config.onExportComplete(file);
      return;
    }

    const downloadLink = document.createElement('a');
    downloadLink.download = `print-area-snapshot-${Date.now()}.png`;
    downloadLink.href = dataURL;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }, [
    printAreaClipPath,
    templateDims.height,
    templateDims.width,
    config,
  ]);

  return (
    <div className="app-container">
      <div className="controls">
        <button className="export-btn" type="button" onClick={handleUploadArtworkClick}>
          Upload Artwork
        </button>

        <input
          ref={fileInputArtworkRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => void handleArtworkFile(e.target.files?.[0] ?? null)}
        />

        <button className="export-btn" type="button" onClick={() => void handleExportClick()}>
          Export Full Template Snapshot
        </button>
      </div>

      <div className="workspace-stage" ref={stageElRef}>
        <div className="canvas-container">
          <canvas ref={canvasElRef} />
        </div>
      </div>
    </div>
  );
}
