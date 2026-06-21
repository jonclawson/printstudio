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

    // Poster example Product
    //  "id": 1,
    //         "main_category_id": 55,
    //         "type": "POSTER",
    //         "description": "Museum-quality posters made on thick matte paper. Add a wonderful accent to your room and office with these posters that are sure to brighten any environment.\n\n• Paper thickness: 10.3 mil\n• Paper weight: 189 g/m²\n• Opacity: 94%\n• ISO brightness: 104%\n• Paper is sourced from Japan",
    //         "type_name": "Paper Poster (in) | Matte",
    //         "title": "Enhanced Matte Paper Poster (in)",
    //         "brand": null,
    //         "model": "Paper Poster (in) | Matte",
    //         "image": "https://files.cdn.printful.com/o/products/1/product_1613463122.jpg",
    //         "variant_count": 33,
    //         "currency": "USD",
    //         "options": [],
    //         "dimensions": {
    //             "8×10": "8×10",
    //             "10x10": "10x10",
    //             "12×12": "12×12",
    //             "12×16": "12×16",
    //             "12×18": "12×18",
    //             "14×14": "14×14",
    //             "16×16": "16×16",
    //             "16×20": "16×20",
    //             "18×18": "18×18",
    //             "18×24": "18×24",
    //             "24×36": "24×36"
    //         },
    //         "is_discontinued": false,
    //         "avg_fulfillment_time": null,
    //         "techniques": [
    //             {
    //                 "key": "DIGITAL",
    //                 "display_name": "Digital printing",
    //                 "is_default": true
    //             }
    //         ],
    //         "files": [
    //             {
    //                 "id": "default",
    //                 "type": "default",
    //                 "title": "Print file",
    //                 "additional_price": null,
    //                 "options": []
    //             },
    //             {
    //                 "id": "preview",
    //                 "type": "mockup",
    //                 "title": "Mockup",
    //                 "additional_price": null,
    //                 "options": []
    //             }
    //         ],
    //         "origin_country": null
    //     },
    // Poster exmple variant
    //  {
    //             "id": 48497,
    //             "product_id": 1,
    //             "name": "Enhanced Matte Paper Poster 20″×24″",
    //             "size": "20″×24″",
    //             "color": null,
    //             "color_code": null,
    //             "color_code2": null,
    //             "image": "https://files.cdn.printful.com/products/1/48497_1777277691.jpg",
    //             "price": "12.89",
    //             "in_stock": true,
    //             "availability_regions": {
    //                 "US": "United States",
    //                 "EU": "Europe",
    //                 "EU_LV": "Latvia",
    //                 "CA": "Canada",
    //                 "UK": "United Kingdom"
    //             },
    //             "availability_status": [
    //                 {
    //                     "region": "US",
    //                     "status": "in_stock"
    //                 },
    //                 {
    //                     "region": "EU",
    //                     "status": "in_stock"
    //                 },
    //                 {
    //                     "region": "EU_LV",
    //                     "status": "in_stock"
    //                 },
    //                 {
    //                     "region": "CA",
    //                     "status": "in_stock"
    //                 },
    //                 {
    //                     "region": "UK",
    //                     "status": "in_stock"
    //                 }
    //             ],
    //             "material": []
    //         },
    // Poster example printfile
    //    {
    //     "printfile_id": 1613,
    //     "width": 7200,
    //     "height": 6000,
    //     "dpi": 300,
    //     "fill_mode": "cover",
    //     "can_rotate": true
    // },
    // Poster exmaple template
    // {
    //             "template_id": 1117371,
    //             "image_url": "https://files.cdn.printful.com/o/upload/api-template/07/07315c6709e0f2a610c4a8f32897b90d?v=1775134184",
    //             "background_url": null,
    //             "background_color": null,
    //             "printfile_id": 1613,
    //             "template_width": 3000,
    //             "template_height": 3000.0,
    //             "print_area_width": 2886.0,
    //             "print_area_height": 2404.0,
    //             "print_area_top": 298.0,
    //             "print_area_left": 57.0,
    //             "is_template_on_front": true,
    //             "orientation": "horizontal"
    //         },

    return {
      // template_width: first.template_width,
      // template_height: first.template_height,
      // print_area_width: first.print_area_width,
      // print_area_height: first.print_area_height,
      // print_area_top: first.print_area_top,
      // print_area_left: first.print_area_left,
      // image_url: first.image_url,
      // background_color: first.background_color ?? null,

      // printfile_width: printfile.width,
      // printfile_height: printfile.height,
      // printfile_dpi: printfile.dpi,

      template_width: 3000,
      template_height: 3000,
      print_area_width: 2886,
      print_area_height: 2404,
      print_area_top: 298,
      print_area_left: 57,
      image_url: "https://files.cdn.printful.com/o/upload/api-template/07/07315c6709e0f2a610c4a8f32897b90d?v=1775134184",
      background_color: null,

      printfile_width: 7200,
      printfile_height: 6000,
      printfile_dpi: 300,
      fill_mode: "cover",

      onSaveThumb: async (file: File) => {
        downloadFileInBrowser(file);
        console.log('Exported thumb:', {
          name: file.name,
          size: file.size,
          type: file.type,
        });
      },

      onExportComplete: async (file: File) => {
        // demo behavior: log
        downloadFileInBrowser(file);
        console.log('Exported file:', {
          name: file.name,
          size: file.size,
          type: file.type,
        });
      },
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
