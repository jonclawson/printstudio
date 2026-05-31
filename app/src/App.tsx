import { useEffect, useMemo, useState } from 'react';
import DesignStudio from './components/DesignStudio';
import type { TemplateConfig } from './types/template';

import mockupTemplatesJson from '../../api/v2/catalog-products/679/mockup-templates.json';

type MockupTemplateRecord = {
  template_width: number;
  template_height: number;
  print_area_width: number;
  print_area_height: number;
  print_area_top: number;
  print_area_left: number;
  image_url: string;
  background_color?: string | null;
};

type MockupTemplatesResponse = {
  data?: MockupTemplateRecord[];
};

export default function App() {
  const fallbackConfig: TemplateConfig | null = useMemo(() => {
    const payload = mockupTemplatesJson as unknown as MockupTemplatesResponse;
    const first = payload.data?.[0];
    if (!first) return null;

    return {
      template_width: first.template_width,
      template_height: first.template_height,
      print_area_width: first.print_area_width,
      print_area_height: first.print_area_height,
      print_area_top: first.print_area_top,
      print_area_left: first.print_area_left,
      image_url: first.image_url,
      background_color: first.background_color ?? null,
      // onExportComplete: async (file: File) => {
      //   // For demo purposes, we'll just log the file info.
      //   // In a real app, you might upload this to a server or trigger a download.
      //   console.log('Exported file:', {
      //     name: file.name,
      //     size: file.size,
      //     type: file.type,
      //   });
      // }
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

        if (res.ok) {
          const payloadUnknown: unknown = await res.json();
          const payload = payloadUnknown as MockupTemplatesResponse;
          const first = payload.data?.[0];

          if (first) {
            setConfig({
              template_width: first.template_width,
              template_height: first.template_height,
              print_area_width: first.print_area_width,
              print_area_height: first.print_area_height,
              print_area_top: first.print_area_top,
              print_area_left: first.print_area_left,
              image_url: first.image_url,
              background_color: first.background_color ?? null,
              onExportComplete: async (file: File) => {
                // For demo purposes, we'll just log the file info.
                // In a real app, you might upload this to a server or trigger a download.
                console.log('Exported file:', {
                  name: file.name,
                  size: file.size,
                  type: file.type,
                });
              }
            });
            return;
          }
        }

        if (fallbackConfig) setConfig(fallbackConfig);
        else setError('Failed to load template config.');
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

  return <DesignStudio config={config} />;
}
