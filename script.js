window.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("file");
  const printBtn = document.getElementById("printBtn");
  const preview = document.getElementById("preview");
  const statusEl = document.getElementById("status");
  const directionEl = document.getElementById("direction");
  const fontSizeEl = document.getElementById("fontsize");

  let htmlText = "";

  const setStatus = (msg) => { statusEl.textContent = msg; };

  fileInput.addEventListener("change", async () => {
    const f = fileInput.files?.[0];
    if (!f) {
      printBtn.disabled = true;
      setStatus("Choose an HTML file to start.");
      return;
    }

    htmlText = await f.text();
    preview.srcdoc = htmlText;

    printBtn.disabled = false;
    setStatus(`Loaded: ${f.name}\nReady ✅ Click “Print Sideways”.`);
  });

  printBtn.addEventListener("click", () => {
    if (!htmlText) return;

    const direction = directionEl.value; // "ccw" or "cw"
    const fontSize = Number(fontSizeEl.value);

    // Use writing-mode for print (cleaner than transform rotate)
    // Add break rules to keep chunks together as much as possible.
    const printCSS = `
      <style>
        @page { size: letter portrait; margin: 0.5in; }

        /* Remove common site chrome if present */
        header, nav, footer, .nav, .menu, .sidebar, .breadcrumbs { display:none !important; }

        /* Print-only sideways layout */
        @media print {
          body {
            font-size: ${fontSize}pt;
            line-height: 1.35;
            writing-mode: vertical-rl;
            /* flip so it reads like a normal 90° rotation */
            transform: ${direction === "cw" ? "none" : "rotate(180deg)"};
            transform-origin: center;
          }

          /* Keep content together (best-effort) */
          .keep-together, li, pre, blockquote, table, dl, figure {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          /* Prevent orphan headings */
          h1, h2, h3, h4 {
            break-after: avoid;
            page-break-after: avoid;
          }

          /* Keep headings with their first content block */
          h1 + p, h2 + p, h3 + p, h4 + p,
          h2 + ul, h3 + ul, h4 + ul,
          h2 + ol, h3 + ol, h4 + ol {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      </style>
    `;

    const w = window.open("", "_blank");
    if (!w) {
      setStatus("Popup blocked. Allow popups for this site, then try again.");
      return;
    }

    w.document.open();
    w.document.write(`<!doctype html><html><head><meta charset="utf-8">${printCSS}</head><body>${htmlText}</body></html>`);
    w.document.close();

    w.onload = () => {
      // IMPORTANT: user must disable “Headers and footers” in print dialog
      w.print();
    };
  });
});
