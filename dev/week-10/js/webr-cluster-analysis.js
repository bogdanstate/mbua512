/**
 * WebR Cluster Analysis Interactive
 * Uses R running in the browser (via WASM) to perform cluster analysis
 * on the injury prediction dataset
 */

// Import WebR from CDN
import { WebR } from 'https://cdn.jsdelivr.net/npm/webr@0.2.2/dist/webr.mjs';

export async function initWebRClusterAnalysis(containerId, options = {}) {
  const {
    dataFile = 'data/injury-runner-sample.csv',
    width = 1200,
    height = 700,
    nClusters = 3,
    method = 'kmeans'
  } = options;

  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container ${containerId} not found`);
    return;
  }

  // Check for debug mode via URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const debugMode = urlParams.has('debug');

  // Debug logger that shows on page if debug mode is enabled
  const debugLog = (msg) => {
    console.log(msg);
    if (debugMode) {
      const debugDiv = document.getElementById('webr-debug-log') || (() => {
        const div = document.createElement('div');
        div.id = 'webr-debug-log';
        div.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; background: #000; color: #0f0; padding: 10px; max-height: 200px; overflow-y: auto; font-family: monospace; font-size: 12px; z-index: 9999; border-bottom: 2px solid #0f0;';
        document.body.appendChild(div);
        return div;
      })();
      debugDiv.innerHTML += msg + '<br>';
      debugDiv.scrollTop = debugDiv.scrollHeight;
    }
  };

  // Create loading indicator
  container.innerHTML = `
    <div style="text-align: center; padding: 50px; color: #ddd;">
      <div class="loading-spinner" style="font-size: 24px;">⏳</div>
      <p style="margin-top: 20px;">Loading R environment and running cluster analysis...</p>
      <p style="font-size: 12px; opacity: 0.7;">This may take a few moments on first load</p>
      <p style="font-size: 12px; opacity: 0.7;">Installing packages: cluster</p>
    </div>
  `;

  try {
    debugLog('🚀 Starting webR cluster analysis');

    // Initialize webR
    debugLog('Initializing webR...');
    const webR = new WebR();
    await webR.init();
    debugLog('✓ webR initialized');

    // Update status
    container.innerHTML = `
      <div style="text-align: center; padding: 50px; color: #ddd;">
        <div class="loading-spinner" style="font-size: 24px;">⏳</div>
        <p style="margin-top: 20px;">Installing R packages...</p>
        <p style="font-size: 12px; opacity: 0.7;">This step may take 1-2 minutes</p>
      </div>
    `;

    // Install required packages
    // Note: RKaggle not available in webR, using direct CSV download instead
    debugLog('Installing cluster package...');
    await webR.installPackages(['cluster']);
    debugLog('✓ Packages installed');

    // Update status
    container.innerHTML = `
      <div style="text-align: center; padding: 50px; color: #ddd;">
        <div class="loading-spinner" style="font-size: 24px;">⏳</div>
        <p style="margin-top: 20px;">Loading dataset...</p>
        <p style="font-size: 12px; opacity: 0.7;">Injury prediction data for competitive runners</p>
      </div>
    `;

    // Read the CSV file from our local data
    debugLog(`Fetching CSV from: ${dataFile}`);
    const response = await fetch(dataFile);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${dataFile}: ${response.statusText}`);
    }
    const csvText = await response.text();

    debugLog(`✓ CSV loaded: ${csvText.length} bytes`);
    debugLog(`First 200 chars: ${csvText.substring(0, 200)}`);

    // Upload CSV to webR filesystem (as Uint8Array for proper encoding)
    const encoder = new TextEncoder();
    const csvBytes = encoder.encode(csvText);
    await webR.FS.writeFile('/data.csv', csvBytes);
    debugLog('✓ CSV uploaded to webR filesystem');

    // Generate R code for cluster analysis
    const rCode = `
      library(cluster)

      # Read the injury prediction dataset
      # This is based on: https://www.kaggle.com/datasets/shashwatwork/injury-prediction-for-competitive-runners
      data <- read.csv('/data.csv', stringsAsFactors = FALSE)

      # Debug: Check data dimensions
      if (nrow(data) == 0 || ncol(data) == 0) {
        stop("Error: CSV file is empty or could not be read properly")
      }

      # Write debug info
      writeLines(paste("Data dimensions:", nrow(data), "rows x", ncol(data), "cols"), '/debug.txt')
      writeLines(paste("Column names:", paste(names(data), collapse = ", ")), '/debug.txt', sep = "\n")

      # Aggregate by athlete if we have athlete IDs
      # The dataset is weekly training data, but we want to cluster athletes
      athlete_id_col <- grep("athlete|id|subject", names(data), ignore.case = TRUE)[1]

      if (!is.na(athlete_id_col) && length(unique(data[, athlete_id_col])) < nrow(data)) {
        # We have multiple rows per athlete - aggregate by mean
        athlete_id <- names(data)[athlete_id_col]
        data <- aggregate(. ~ data[, athlete_id_col], data = data, FUN = mean, na.rm = TRUE)
        names(data)[1] <- "Athlete_ID"
      }

      # For demo purposes, if dataset is large, sample it
      if (nrow(data) > 100) {
        set.seed(123)
        data <- data[sample(nrow(data), 100), ]
      }

      # Select numeric columns for clustering (exclude IDs and categorical)
      numeric_cols <- sapply(data, is.numeric)
      data_numeric <- data[, numeric_cols]

      # Remove any columns with NA or infinite values
      data_numeric <- data_numeric[, colSums(is.na(data_numeric)) == 0]
      data_numeric <- data_numeric[, sapply(data_numeric, function(x) all(is.finite(x)))]

      # If we have too many columns, select first 6 for visualization
      if (ncol(data_numeric) > 6) {
        data_numeric <- data_numeric[, 1:6]
      }

      # Normalize data (z-score standardization)
      data_scaled <- scale(data_numeric)

      # Perform K-means clustering
      set.seed(123)
      kmeans_result <- kmeans(data_scaled, centers = ${nClusters}, nstart = 25)

      # Create layout with 3 plots
      png('/plot.png', width = ${width}, height = ${height}, res = 100)
      par(mfrow = c(2, 2), bg = '#1e1e1e', col.main = 'white', col.lab = 'white',
          col.axis = 'white', fg = 'white')

      # Plot 1: Cluster plot (first 2 PCA components)
      pca_result <- prcomp(data_scaled)
      plot(pca_result$x[, 1:2],
           col = kmeans_result$cluster + 1,
           pch = 19,
           cex = 1.5,
           main = paste0('K-means Clustering (k = ', ${nClusters}, ')'),
           xlab = paste0('PC1 (', round(summary(pca_result)$importance[2, 1] * 100, 1), '% variance)'),
           ylab = paste0('PC2 (', round(summary(pca_result)$importance[2, 2] * 100, 1), '% variance)'))

      # Add cluster centers
      centers_pca <- predict(pca_result, kmeans_result$centers)[, 1:2]
      points(centers_pca, col = 1:${nClusters} + 1, pch = 8, cex = 3, lwd = 3)

      # Add legend
      legend('topright',
             legend = paste('Cluster', 1:${nClusters}),
             col = 1:${nClusters} + 1,
             pch = 19,
             bg = '#2e2e2e',
             text.col = 'white')

      # Plot 2: Within-cluster sum of squares (Elbow method)
      wss <- sapply(1:min(10, nrow(data_scaled) - 1), function(k) {
        kmeans(data_scaled, centers = k, nstart = 10)$tot.withinss
      })
      plot(1:length(wss), wss,
           type = 'b',
           col = '#4fc3f7',
           pch = 19,
           lwd = 2,
           main = 'Elbow Method (Total Within SS)',
           xlab = 'Number of Clusters (k)',
           ylab = 'Total Within-Cluster Sum of Squares')
      abline(v = ${nClusters}, col = '#f44336', lty = 2, lwd = 2)

      # Plot 3: Silhouette plot
      sil <- silhouette(kmeans_result$cluster, dist(data_scaled))
      avg_sil <- mean(sil[, 3])

      plot(sil[, 1], sil[, 3],
           col = sil[, 1] + 1,
           pch = 19,
           main = paste0('Silhouette Plot (avg = ', round(avg_sil, 3), ')'),
           xlab = 'Cluster',
           ylab = 'Silhouette Width',
           xlim = c(0.5, ${nClusters} + 0.5))
      abline(h = avg_sil, col = '#4caf50', lty = 2, lwd = 2)
      abline(h = 0, col = 'white', lty = 1)

      # Plot 4: Cluster sizes
      cluster_sizes <- table(kmeans_result$cluster)
      barplot(cluster_sizes,
              col = 1:${nClusters} + 1,
              main = 'Cluster Sizes',
              xlab = 'Cluster',
              ylab = 'Number of Athletes',
              border = 'white')

      dev.off()

      # Save summary statistics
      summary_text <- paste0(
        'K-means Clustering Results\\n',
        '==========================\\n',
        'Number of clusters: ', ${nClusters}, '\\n',
        'Total observations: ', nrow(data_scaled), '\\n',
        'Features used: ', ncol(data_scaled), '\\n',
        'Average silhouette width: ', round(avg_sil, 3), '\\n\\n',
        'Cluster sizes:\\n',
        paste(capture.output(print(cluster_sizes)), collapse = '\\n'), '\\n\\n',
        'Between-cluster SS / Total SS: ',
        round(kmeans_result$betweenss / kmeans_result$totss * 100, 1), '%'
      )

      writeLines(summary_text, '/summary.txt')
    `;

    // Execute R code
    debugLog('Running R cluster analysis...');
    await webR.evalR(rCode);
    debugLog('✓ R analysis complete');

    // Read the generated PNG
    debugLog('Reading generated plot...');
    const pngData = await webR.FS.readFile('/plot.png');
    const blob = new Blob([pngData], { type: 'image/png' });
    const imageUrl = URL.createObjectURL(blob);
    debugLog(`✓ Plot generated: ${pngData.length} bytes`);

    // Read summary statistics
    const summaryData = await webR.FS.readFile('/summary.txt');
    const summaryText = new TextDecoder().decode(summaryData);
    debugLog('✓ Summary statistics retrieved');

    // Display the results
    container.innerHTML = `
      <div style="text-align: center;">
        <img src="${imageUrl}" alt="Cluster Analysis Results" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); margin-bottom: 20px;">

        <div style="background: #2e2e2e; border-left: 4px solid #4caf50; padding: 20px; margin: 20px auto; max-width: 800px; text-align: left; border-radius: 8px;">
          <h3 style="margin-top: 0; color: #4caf50;">📊 Cluster Analysis Summary</h3>
          <pre style="margin: 0; color: #e0e0e0; font-family: 'Courier New', monospace; font-size: 0.85em; white-space: pre-wrap;">${summaryText}</pre>
        </div>

        <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 8px; max-width: 800px; margin-left: auto; margin-right: auto;">
          <p style="margin: 0; font-size: 0.9em; color: #856404;">
            💡 <strong>Interpretation Tips:</strong>
          </p>
          <ul style="text-align: left; font-size: 0.85em; color: #856404; margin: 10px 0 0 20px;">
            <li><strong>Silhouette Width:</strong> Values near 1 indicate well-separated clusters, near 0 indicates overlapping clusters</li>
            <li><strong>Elbow Plot:</strong> Look for the "elbow" where adding clusters gives diminishing returns</li>
            <li><strong>Between SS %:</strong> Higher percentages indicate clusters explain more variance in the data</li>
          </ul>
        </div>
      </div>
    `;

  } catch (error) {
    console.error('WebR error:', error);
    debugLog(`❌ ERROR: ${error.message}`);

    // Try to read debug info if available
    let debugInfo = '';
    try {
      const debugData = await webR.FS.readFile('/debug.txt');
      debugInfo = new TextDecoder().decode(debugData);
    } catch (e) {
      debugInfo = 'Debug info not available';
    }

    container.innerHTML = `
      <div style="text-align: center; padding: 50px; color: #ff6b6b;">
        <h3>Error generating cluster analysis</h3>
        <p style="font-size: 14px; opacity: 0.8; max-width: 600px; margin: 20px auto;">${error.message}</p>
        <div style="background: #2e2e2e; border-left: 4px solid #f44336; padding: 20px; margin: 20px auto; max-width: 800px; text-align: left; border-radius: 8px;">
          <p style="color: #e0e0e0; font-size: 0.85em; margin: 0;">
            <strong>Troubleshooting:</strong><br>
            • Ensure the data file exists at: ${dataFile}<br>
            • Check browser console for detailed error messages<br>
            • WebR requires a modern browser with WebAssembly support<br>
            • First load may take longer while packages install
          </p>
          <pre style="color: #e0e0e0; font-size: 0.75em; margin-top: 15px; white-space: pre-wrap;">Debug Info:\n${debugInfo}</pre>
        </div>
      </div>
    `;
  }
}
