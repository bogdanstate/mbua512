/**
 * WebR Heatmap Generator
 * Uses R running in the browser (via WASM) to generate statistical heatmaps
 */

export async function initWebRHeatmap(containerId, options = {}) {
  const {
    dataFile = 'data/jaccard-matrix.csv',
    title = 'Heatmap',
    subtitle = '',
    colorScheme = 'Reds',
    width = 800,
    height = 700
  } = options;

  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container ${containerId} not found`);
    return;
  }

  // Create loading indicator
  container.innerHTML = `
    <div style="text-align: center; padding: 50px; color: #ddd;">
      <div class="loading-spinner" style="font-size: 24px;">⏳</div>
      <p style="margin-top: 20px;">Loading R environment and generating visualization...</p>
      <p style="font-size: 12px; opacity: 0.7;">This may take a few moments on first load</p>
    </div>
  `;

  try {
    // Initialize webR
    const webR = new WebR();
    await webR.init();

    // Install required packages
    await webR.installPackages(['pheatmap', 'RColorBrewer']);

    // Read the CSV file
    const response = await fetch(dataFile);
    const csvText = await response.text();

    // Upload CSV to webR filesystem
    await webR.FS.writeFile('/data.csv', csvText);

    // Generate R code for heatmap
    const rCode = `
      library(pheatmap)
      library(RColorBrewer)

      # Read data
      data <- read.csv('/data.csv', row.names = 1, check.names = FALSE)

      # Convert to matrix
      mat <- as.matrix(data)

      # Generate heatmap
      png('/plot.png', width = ${width}, height = ${height}, res = 100)
      pheatmap(mat,
               color = colorRampPalette(brewer.pal(9, "${colorScheme}"))(100),
               display_numbers = TRUE,
               number_format = "%.2f",
               fontsize = 10,
               fontsize_number = 8,
               cluster_rows = ${options.cluster !== false},
               cluster_cols = ${options.cluster !== false},
               main = "${title}\\n${subtitle}",
               border_color = "grey90",
               cellwidth = ${options.cellWidth || 40},
               cellheight = ${options.cellHeight || 40})
      dev.off()
    `;

    // Execute R code
    await webR.evalR(rCode);

    // Read the generated PNG
    const pngData = await webR.FS.readFile('/plot.png');
    const blob = new Blob([pngData], { type: 'image/png' });
    const imageUrl = URL.createObjectURL(blob);

    // Display the image
    container.innerHTML = `
      <div style="text-align: center;">
        <img src="${imageUrl}" alt="${title}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
      </div>
    `;

  } catch (error) {
    console.error('WebR error:', error);
    container.innerHTML = `
      <div style="text-align: center; padding: 50px; color: #ff6b6b;">
        <p>Error generating visualization</p>
        <p style="font-size: 12px; opacity: 0.7;">${error.message}</p>
      </div>
    `;
  }
}
