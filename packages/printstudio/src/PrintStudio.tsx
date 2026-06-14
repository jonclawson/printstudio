import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Canvas, FabricObject, Image as FabricImage, Rect } from 'fabric';
import type { TemplateConfig } from './types/template';
import './printstudio.css';

type FabricCanvasRef = React.MutableRefObject<Canvas | null>;

export default function PrintStudio({ config }: { config: TemplateConfig }) {
  const canvasElRef = useRef<HTMLCanvasElement | null>(null);
  const stageElRef = useRef<HTMLDivElement | null>(null);

  const canvasRef: FabricCanvasRef = useRef<Canvas | null>(null);
  const bgImageRef = useRef<FabricImage | null>(null);
  const bgColorRectRef = useRef<Rect | null>(null);
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
    canvas.requestRenderAll();
  }, [templateDims.height, templateDims.width]);

  const drawPrintAreaGuidelines = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.off('after:render');

    canvas.on('after:render', (options: { ctx?: CanvasRenderingContext2D }) => {
      const ctx = options.ctx;
      if (!ctx) return;

      // 1. Get Fabric's internal viewport transform matrix [scaleX, skewY, skewX, scaleY, translateX, translateY]
      const vpt = canvas.viewportTransform;
      
      // 2. Get the device pixel ratio backing the retina/HDPI canvas layout
      const retina = canvas.getRetinaScaling();

      ctx.save();

      // 3. Set the absolute transform mapping to match Fabric's exact positioning space
      ctx.setTransform(
        vpt[0] * retina, 
        vpt[1] * retina, 
        vpt[2] * retina, 
        vpt[3] * retina, 
        vpt[4] * retina, 
        vpt[5] * retina
      );
      
      // 4. Calculate an inverse scale value so your lines and text remain beautifully sharp 
      // regardless of how large or small the browser scaling changes
      const currentZoom = canvas.getZoom();
      const thicknessScale = 1 / currentZoom;

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
    // drawPrintAreaGuidelines();

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

  /**
   * Sync the background color Rect with config.background_color.
   * Creates/updates/removes a full-canvas Rect at index 0 below the ghost image.
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const color = config.background_color;

    if (color) {
      if (bgColorRectRef.current && canvas.contains(bgColorRectRef.current)) {
        bgColorRectRef.current.set({ fill: color });
        canvas.requestRenderAll();
        return;
      }

      const rect = new Rect({
        left: 0,
        top: 0,
        width: templateDims.width,
        height: templateDims.height,
        fill: color,
        selectable: false,
        evented: false,
        excludeFromExport: true,
        absolutePositioned: true,
        originX: 'left',
        originY: 'top',
      });

      bgColorRectRef.current = rect;

      canvas.insertAt(0, rect);

      canvas.requestRenderAll();
    } else {
      if (bgColorRectRef.current) {
        canvas.remove(bgColorRectRef.current);
        bgColorRectRef.current.dispose();
        bgColorRectRef.current = null;
        canvas.requestRenderAll();
      }
    }
  }, [config.background_color, templateDims.height, templateDims.width]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const cancelledRef = { cancelled: false };

    const loadBg = async () => {
      // 1. Fetch the image and get the raw blob data
    const response = await fetch(config.image_url);
    const imageBlob = await response.blob();

    // 2. Create a local object URL from the blob
    const blobUrl = URL.createObjectURL(imageBlob);

    // 3. Pass the blob URL to Fabric.js (local URL, no CORS needed)
      const nextBg = await FabricImage.fromURL(blobUrl);

      if (cancelledRef.cancelled) {
        nextBg.dispose();
        return;
      }

      if (bgImageRef.current) {
        canvas.remove(bgImageRef.current);
        bgImageRef.current.dispose();
      }

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
        evented: false,
      });

      bgImageRef.current = nextBg;

      // Check if the background color rectangle is currently active on the canvas
      const hasBgColor = bgColorRectRef.current && canvas.contains(bgColorRectRef.current);
      const targetIndex = hasBgColor ? 2 : 0;

      // CORRECT SIGNATURE: index first, then object
      canvas.insertAt(targetIndex, nextBg);

      canvas.requestRenderAll();
    };

    void loadBg();

    return () => {
      cancelledRef.cancelled = true;
    };
  }, [config.image_url, templateDims.height, templateDims.width]);

  const handleArtworkFile = useCallback(
    async (file: File | null) => {
      const canvas = canvasRef.current;
      if (!canvas || !file) return;

      const areaClip = printAreaClipPath();
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

      canvas.insertAt(1, img);
      canvas.setActiveObject(img);
      canvas.requestRenderAll();
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
    canvas.requestRenderAll();

    // 1) Existing behavior: export print-area snapshot (artwork only, no bg)
    const offscreenEl = document.createElement('canvas');
    const offscreenCanvas = new Canvas(offscreenEl, {
      width: templateDims.width,
      height: templateDims.height,
      backgroundColor: 'rgba(0,0,0,0)',
    });

    const exportClip = printAreaClipPath();

    const targetObjects = canvas
      .getObjects()
      .filter(
        (obj) =>
          obj !== bgImageInstance &&
          obj !== bgColorRectRef.current,
      ) as FabricObject[];

    await Promise.all(
      targetObjects.map(async (obj) => {
        const clonedObj = await obj.clone();
        clonedObj.clipPath = exportClip;
        offscreenCanvas.add(clonedObj);
      }),
    );

    offscreenCanvas.requestRenderAll();

    const dataURL = offscreenCanvas.toDataURL({
      format: 'png',
      left: config.print_area_left,
      top: config.print_area_top,
      width: config.print_area_width,
      height: config.print_area_height,
      multiplier: config.printfile_width / config.print_area_width,
    });

    offscreenCanvas.dispose();

    if (config.onExportComplete) {
      const res = await fetch(dataURL);
      const blob = await res.blob();
      const file = new File([blob], `print-area-${Date.now()}.png`, {
        type: 'image/png',
      });
      await config.onExportComplete(file);
    } else {
      const downloadLink = document.createElement('a');
      downloadLink.download = `print-area-snapshot-${Date.now()}.png`;
      downloadLink.href = dataURL;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }

    // 2) New behavior: save thumb (background + artwork as seen, but NO red overlay)
    // The red "PRINT AREA BOUNDARY" is drawn via an "after:render" handler on the *main* canvas,
    // so the offscreen canvas will naturally not include it.
    const thumbOffscreenEl = document.createElement('canvas');
    const thumbOffscreenCanvas = new Canvas(thumbOffscreenEl, {
      width: templateDims.width,
      height: templateDims.height,
      backgroundColor: 'rgba(0,0,0,0)',
    });

    const thumbObjects = canvas.getObjects() as FabricObject[];

    await Promise.all(
      thumbObjects.map(async (obj) => {
        const clonedObj = await obj.clone();
        thumbOffscreenCanvas.add(clonedObj);
      }),
    );

    thumbOffscreenCanvas.requestRenderAll();

    const thumbDataURL = thumbOffscreenCanvas.toDataURL({
      format: 'png',
      multiplier: 1,
    });

    thumbOffscreenCanvas.dispose();

    const thumbRes = await fetch(thumbDataURL);
    const thumbBlob = await thumbRes.blob();
    const thumbFile = new File([thumbBlob], `thumb-${Date.now()}.png`, {
      type: 'image/png',
    });

    if (config.onSaveThumb) {
      await config.onSaveThumb(thumbFile);
      return;
    }

    const thumbDownloadLink = document.createElement('a');
    thumbDownloadLink.download = `thumb-${Date.now()}.png`;
    thumbDownloadLink.href = thumbDataURL;
    document.body.appendChild(thumbDownloadLink);
    thumbDownloadLink.click();
    document.body.removeChild(thumbDownloadLink);
  }, [config, printAreaClipPath, templateDims.height, templateDims.width]);

  return (
    <div className="app-container">
      <div className="controls">
        <button className="export-btn" type="button" onClick={handleUploadArtworkClick}>
          Upload
        </button>

        <input
          ref={fileInputArtworkRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => void handleArtworkFile(e.target.files?.[0] ?? null)}
        />

        <button className="export-btn" type="button" onClick={() => void handleExportClick()}>
          Save
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
