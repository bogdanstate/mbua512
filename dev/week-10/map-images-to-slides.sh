#!/bin/bash

# This script helps identify which images belong to which slides
# by displaying the original slide screenshots and extracted images

cd /home/bogdan/mbua512/dev/week-10

echo "=== Image to Slide Mapping ==="
echo ""
echo "We have 55 slide screenshots in assets/original-slides/"
echo "We have $(ls assets/images/*.{png,jpg,jpeg,gif} 2>/dev/null | wc -l) extracted images in assets/images/"
echo ""
echo "To map images to slides, we'll create a visual index:"
echo ""

# Create an HTML viewer to help visualize the mapping
cat > image-mapper.html <<'EOF'
<!DOCTYPE html>
<html>
<head>
  <title>Image to Slide Mapper</title>
  <style>
    body { font-family: monospace; padding: 20px; background: #f5f5f5; }
    .slide-group {
      margin: 30px 0;
      padding: 20px;
      background: white;
      border: 2px solid #ddd;
      border-radius: 8px;
    }
    .slide-screenshot {
      max-width: 800px;
      border: 2px solid #333;
      margin: 10px 0;
      display: block;
    }
    .extracted-images {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 15px;
      margin: 20px 0;
    }
    .extracted-img {
      border: 2px solid #0984e3;
      padding: 5px;
      background: #f8f9fa;
      border-radius: 4px;
    }
    .extracted-img img {
      max-width: 100%;
      height: auto;
      display: block;
    }
    .extracted-img p {
      margin: 5px 0 0 0;
      font-size: 11px;
      color: #666;
    }
    h2 { color: #333; border-bottom: 2px solid #0984e3; padding-bottom: 10px; }
    h3 { color: #666; margin: 20px 0 10px 0; }
  </style>
</head>
<body>
  <h1>📊 Image to Slide Mapper</h1>
  <p>Compare original slides with extracted images to identify which images belong where.</p>
EOF

# Add each slide
for i in {1..55}; do
  slide_num=$(printf "%02d" $i)

  cat >> image-mapper.html <<EOF
  <div class="slide-group">
    <h2>Slide ${i}</h2>
    <img src="assets/original-slides/slide-${slide_num}.png" class="slide-screenshot" alt="Slide ${i}">

    <h3>All Extracted Images (for reference):</h3>
    <div class="extracted-images">
EOF

  # Add all extracted images for comparison
  for img in assets/images/image*.{png,jpg,jpeg,gif}; do
    if [ -f "$img" ]; then
      filename=$(basename "$img")
      cat >> image-mapper.html <<EOF
      <div class="extracted-img">
        <img src="$img" alt="$filename">
        <p>$filename</p>
      </div>
EOF
    fi
  done

  cat >> image-mapper.html <<EOF
    </div>
  </div>
EOF
done

cat >> image-mapper.html <<'EOF'
</body>
</html>
EOF

echo "Created image-mapper.html"
echo "Open this file in a browser to visually map images to slides"
echo ""
echo "File location: $(pwd)/image-mapper.html"
