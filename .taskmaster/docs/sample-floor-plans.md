# Sample Floor Plans for Development

## 🏢 **Recommended Public Buildings for Testing**

Since campus floor plans aren't available yet, we'll use publicly available floor plans from real buildings that closely match campus building complexity.

### **Option 1: MIT Building 32 (Stata Center)**
- **Source:** [MIT Floor Plans](https://whereis.mit.edu/?go=32)
- **Why it's good:** Multi-floor academic building, similar to campus buildings
- **Floors:** 4 floors with clear room numbering
- **Features:** Lecture halls, labs, offices, lifts, multiple entrances

### **Option 2: Stanford Gates Computer Science Building**
- **Source:** [Stanford Campus Maps](https://campus-map.stanford.edu/)
- **Why it's good:** Modern CS building layout, clear navigation challenges
- **Floors:** 3 floors with typical CS department layout
- **Features:** Classrooms, labs, common areas, lifts

### **Option 3: UC Berkeley Soda Hall**
- **Source:** [UC Berkeley Building Plans](https://www.berkeley.edu/map/)
- **Why it's good:** Computer Science building with complex layout
- **Floors:** 5 floors, similar room numbering system
- **Features:** Multiple wings, lifts, outdoor connections

## 🛠 **Converting PDF to SVG Workflow**

### **Step 1: Download Floor Plans**
```bash
# Create assets directory
mkdir -p assets/floor-plans/sample-building

# Download PDFs and convert to SVG
# Tools: pdf2svg, Inkscape, or online converters
```

### **Step 2: SVG Optimization**
```bash
# Clean up SVG files for web use
# Remove unnecessary metadata
# Optimize paths and reduce file size
# Ensure consistent coordinate system
```

### **Step 3: Add Navigation Points**
```xml
<!-- Example SVG structure -->
<svg viewBox="0 0 1000 800" xmlns="http://www.w3.org/2000/svg">
  <!-- Floor plan paths -->
  <g id="floor-plan">
    <path d="..." fill="#f0f0f0" stroke="#333"/>
  </g>
  
  <!-- Room labels -->
  <g id="rooms">
    <rect id="room-101" x="100" y="200" width="80" height="60"/>
    <text x="140" y="235">101</text>
  </g>
  
  <!-- Navigation nodes (invisible, for pathfinding) -->
  <g id="nav-nodes" style="display: none;">
    <circle id="node-corridor-a" cx="200" cy="300" r="2"/>
    <circle id="node-room-101" cx="140" cy="230" r="2"/>
  </g>
</svg>
```

## 📍 **Sample Node Structure**

### **Building: Sample Academic Building**
```javascript
// Floor 1 nodes
const floor1Nodes = [
  {
    id: "sample-101",
    label: "Room 101 - Lecture Hall",
    building: "SAMPLE",
    floor: 1,
    x: 140, y: 230,
    nodeType: "room"
  },
  {
    id: "sample-corridor-1a", 
    label: "Main Corridor",
    building: "SAMPLE",
    floor: 1,
    x: 200, y: 300,
    nodeType: "corridor"
  },
  {
    id: "sample-lift-a",
    label: "Lift A",
    building: "SAMPLE", 
    floor: 1,
    x: 500, y: 400,
    nodeType: "lift"
  }
];

// Connections between nodes
const floor1Edges = [
  {
    fromNode: "sample-101",
    toNode: "sample-corridor-1a",
    distance: 15.5,
    weight: 1.0,
    edgeType: "corridor"
  },
  {
    fromNode: "sample-corridor-1a",
    toNode: "sample-lift-a", 
    distance: 32.1,
    weight: 1.0,
    edgeType: "corridor"
  }
];
```

## 🎯 **Development Strategy**

### **Phase 1: Single Sample Floor**
1. **Choose one building** (recommend MIT Stata Center)
2. **Convert 1 floor** to SVG with basic room layout
3. **Add 10-15 nodes** manually (rooms, corridors, lift)
4. **Create 15-20 edges** connecting the nodes
5. **Test pathfinding** between any two rooms

### **Phase 2: Multi-Floor Sample**
1. **Add floors 2-3** of the same building
2. **Connect floors** via lift/stair nodes
3. **Test vertical navigation** between floors
4. **Implement floor switching** UI

### **Phase 3: Campus Replacement**
1. **Replace sample building** with real campus floor plans
2. **Maintain same data structure** 
3. **Update node IDs** to match campus room numbering
4. **Scale to multiple buildings**

## 🔧 **Tools and Scripts**

### **PDF to SVG Conversion**
```bash
# Option 1: pdf2svg (Linux/Mac)
pdf2svg input.pdf output.svg

# Option 2: Inkscape command line
inkscape --pdf-poppler input.pdf --export-type=svg --export-filename=output.svg

# Option 3: Online converters
# - cloudconvert.com
# - convertio.co
```

### **SVG Coordinate Extraction**
```javascript
// Extract room coordinates from SVG
function extractRoomCoordinates(svgElement) {
  const rooms = svgElement.querySelectorAll('[id^="room-"]');
  return Array.from(rooms).map(room => {
    const bbox = room.getBBox();
    return {
      id: room.id,
      x: bbox.x + bbox.width/2,
      y: bbox.y + bbox.height/2,
      width: bbox.width,
      height: bbox.height
    };
  });
}
```

### **Node Generation Script**
```javascript
// Generate navigation nodes from room data
function generateNavNodes(rooms, floorNumber, buildingCode) {
  return rooms.map(room => ({
    id: `${buildingCode.toLowerCase()}-${room.id.replace('room-', '')}`,
    label: `Room ${room.id.replace('room-', '').toUpperCase()}`,
    building: buildingCode,
    floor: floorNumber,
    x: room.x,
    y: room.y,
    nodeType: 'room'
  }));
}
```

## 📚 **Resources**

### **Floor Plan Sources**
- **MIT Campus:** [whereis.mit.edu](https://whereis.mit.edu)
- **Stanford Campus:** [campus-map.stanford.edu](https://campus-map.stanford.edu)
- **UC Berkeley:** [berkeley.edu/map](https://www.berkeley.edu/map)
- **Public Buildings:** [GSA Building Plans](https://www.gsa.gov) (US Government buildings)

### **SVG Learning Resources**
- **MDN SVG Tutorial:** [developer.mozilla.org/en-US/docs/Web/SVG/Tutorial](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial)
- **SVG Optimization:** [SVGO](https://github.com/svg/svgo)
- **Interactive SVG:** [CSS-Tricks SVG Guide](https://css-tricks.com/using-svg/)

## ✅ **Validation Checklist**

Before proceeding with real campus floor plans:

- [ ] Sample building pathfinding works correctly
- [ ] Multi-floor navigation functions properly  
- [ ] QR code integration working with sample nodes
- [ ] Mobile interface responsive and usable
- [ ] Performance acceptable with sample data
- [ ] All team members understand the system
- [ ] Documentation complete for campus floor plan integration

## 🔄 **Migration to Real Campus Plans**

When campus floor plans are ready:

1. **Keep the same database schema** - just change the data
2. **Update building codes** from "SAMPLE" to real building names
3. **Maintain node ID format** but use real room numbers
4. **Replace SVG files** with campus floor plans
5. **Update coordinate systems** if necessary
6. **Bulk import** new node/edge data
7. **Test with real campus room numbers**

This approach ensures we can develop and test the complete system before getting access to the actual campus floor plans! 