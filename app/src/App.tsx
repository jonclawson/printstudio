import { useCallback, useEffect, useMemo, useState } from 'react';

// test package mode
// import 'printstudio/dist/printstudio.css';
// import PrintStudio from 'printstudio';
// import type { TemplateConfig } from 'printstudio';

// Dev mode
import PrintStudio from './components/PrintStudio';
import type { TemplateConfig } from './types/template';

import mockupTemplatesJson from '../../api/v2/catalog-products/679/mockup-templates.json';
import printfilesJson from '../../api/mockup-generator/printfiles/679.json';

type MockupTemplateRecord = {
  template_width: number;
  template_height: number;
  print_area_width: number;
  print_area_height: number;
  print_area_top: number;
  print_area_left: number;
  image_url: string;
  background_color?: string | null;

  printfile_id: number;
};

type MockupTemplatesResponse = {
  data?: MockupTemplateRecord[];
};

type PrintFileEntry = {
  printfile_id: number;
  width: number;
  height: number;
  dpi: number;
  fill_mode: string;
  can_rotate: boolean;
};

type PrintFilesResponse = {
  result?: {
    printfiles?: PrintFileEntry[];
  };
};

function getPrintfileForTemplate(
  templatePrintfileId: number,
  printfiles: PrintFileEntry[] | undefined,
) {
  if (!printfiles) return null;
  return printfiles.find((p) => p.printfile_id === templatePrintfileId) ?? null;
}

export default function App() {
  const downloadFileInBrowser = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    const downloadLink = document.createElement('a');
    downloadLink.download = file.name;
    downloadLink.href = url;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
  }, []);

  const fallbackConfig: TemplateConfig | null = useMemo(() => {
    const payload = mockupTemplatesJson as unknown as MockupTemplatesResponse;
    const first = payload.data?.[0];
    if (!first) return null;

    const printfilesPayload = printfilesJson as unknown as PrintFilesResponse;
    const printfile = getPrintfileForTemplate(first.printfile_id, printfilesPayload.result?.printfiles);
    if (!printfile) return null;

    return {
      template_width: first.template_width,
      template_height: first.template_height,
      print_area_width: first.print_area_width,
      print_area_height: first.print_area_height,
      print_area_top: first.print_area_top,
      print_area_left: first.print_area_left,
      image_url: first.image_url,
      background_color: first.background_color ?? null,

      printfile_width: printfile.width,
      printfile_height: printfile.height,
      printfile_dpi: printfile.dpi,

      // onSaveThumb: async (file: File) => {
      //   downloadFileInBrowser(file);
      // },

      // onExportComplete: async (file: File) => {
      //   // demo behavior: log
      //   console.log('Exported file:', {
      //     name: file.name,
      //     size: file.size,
      //     type: file.type,
      //   });
      // },
    };
  }, []);

  const [config, setConfig] = useState<TemplateConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setError(null);

      try {
        const res = await fetch('/api/v2/catalog-products/679/mockup-templates.json', {
          headers: { Accept: 'application/json' },
        });
        if (cancelled) return;

        if (!res.ok) {
          if (fallbackConfig) setConfig(fallbackConfig);
          else setError('Failed to load template config.');
          return;
        }

        const payloadUnknown: unknown = await res.json();
        const payload = payloadUnknown as MockupTemplatesResponse;
        const first = payload.data?.[0];

        if (!first) {
          if (fallbackConfig) setConfig(fallbackConfig);
          else setError('Failed to load template config.');
          return;
        }

        const printfilesPayload = printfilesJson as unknown as PrintFilesResponse;
        const printfile = getPrintfileForTemplate(first.printfile_id, printfilesPayload.result?.printfiles);
        if (!printfile) {
          if (fallbackConfig) setConfig(fallbackConfig);
          else setError('Failed to resolve printfile dimensions.');
          return;
        }

        setConfig({
          template_width: first.template_width,
          template_height: first.template_height,
          print_area_width: first.print_area_width,
          print_area_height: first.print_area_height,
          print_area_top: first.print_area_top,
          print_area_left: first.print_area_left,
          image_url: first.image_url,
          background_color: first.background_color ?? null,

          printfile_width: printfile.width,
          printfile_height: printfile.height,
          printfile_dpi: printfile.dpi,

          onExportComplete: async (file: File) => {
            console.log('Exported file:', {
              name: file.name,
              size: file.size,
              type: file.type,
            });
          },

          onSaveThumb: async (file: File) => {
            downloadFileInBrowser(file);
          },
        });
      } catch {
        if (fallbackConfig) setConfig(fallbackConfig);
        else setError('Failed to load template config.');
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [fallbackConfig]);

  if (!config) {
    return (
      <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
        {error ? <div>{error}</div> : <div>Loading template…</div>}
      </div>
    );
  }

  return <PrintStudio config={config} />;
}
