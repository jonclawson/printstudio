export type TemplateConfig = {
    template_width: number;
    template_height: number;
    print_area_width: number;
    print_area_height: number;
    print_area_top: number;
    print_area_left: number;
    image_url: string;
    background_color?: string | null;
    /**
     * Target export dimensions (from api/mockup-generator/printfiles/*)
     */
    printfile_width: number;
    printfile_height: number;
    printfile_dpi: number;
    onExportComplete?: (file: File) => void | Promise<void>;
    /**
     * Save a "thumb" image of the full canvas (background + placed artwork),
     * as seen on the page (but without the red print-area overlay).
     */
    onSaveThumb?: (file: File) => void | Promise<void>;
};
//# sourceMappingURL=template.d.ts.map