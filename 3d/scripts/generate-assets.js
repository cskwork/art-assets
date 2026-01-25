const fs = require('fs');
const path = require('path');
const { Document, NodeIO } = require('@gltf-transform/core');

const OUTPUT_DIR = path.resolve(__dirname, '..'); // d:\PARA\Resource\art-assets\3d
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Format Date: YYYYMMDD
const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');

const io = new NodeIO();

async function saveGLB(doc, filename) {
    const buffer = await io.writeBinary(doc);
    const outputPath = path.join(OUTPUT_DIR, filename);
    fs.writeFileSync(outputPath, buffer);
    console.log(`Generated: ${outputPath}`);
}

// --- Math Geometry Helpers ---

function createDocument() {
    return new Document();
}

function createPrimitive(doc, vertices, indices, colors = null) {
    const buffer = doc.createBuffer();
    
    const position = doc.createAccessor()
        .setArray(vertices)
        .setType('VEC3')
        .setBuffer(buffer);

    const primitive = doc.createPrimitive()
        .setAttribute('POSITION', position)
        .setIndices(
            doc.createAccessor()
                .setArray(indices)
                .setType('SCALAR')
                .setBuffer(buffer)
        );

    if (colors) {
        const colorAccessor = doc.createAccessor()
            .setArray(colors)
            .setType('VEC3')
            .setBuffer(buffer);
        primitive.setAttribute('COLOR_0', colorAccessor);
    }

    return primitive;
}

// Helper: Create a cube mesh (box)
function createCubeArrays(min, max, color) {
    // 8 vertices
    const [x1, y1, z1] = min;
    const [x2, y2, z2] = max;
    
    // 24 vertices for flat shading (6 faces * 4 verts)
    // Front, Back, Top, Bottom, Right, Left
    const verts = [];
    const colors = [];
    
    const faces = [
        // Front (z2)
        [x1, y1, z2], [x2, y1, z2], [x2, y2, z2], [x1, y2, z2],
        // Back (z1)
        [x2, y1, z1], [x1, y1, z1], [x1, y2, z1], [x2, y2, z1],
        // Top (y2)
        [x1, y2, z2], [x2, y2, z2], [x2, y2, z1], [x1, y2, z1],
        // Bottom (y1)
        [x1, y1, z1], [x2, y1, z1], [x2, y1, z2], [x1, y1, z2],
        // Right (x2)
        [x2, y1, z2], [x2, y1, z1], [x2, y2, z1], [x2, y2, z2],
        // Left (x1)
        [x1, y1, z1], [x1, y1, z2], [x1, y2, z2], [x1, y2, z1]
    ];
    
    faces.forEach(v => {
        verts.push(...v);
        colors.push(...color);
    });

    const indices = [];
    for(let i=0; i<6; i++) {
        const base = i*4;
        indices.push(base, base+1, base+2, base, base+2, base+3);
    }
    
    return { vertices: new Float32Array(verts), indices: new Uint16Array(indices), colors: new Float32Array(colors) };
}

// 1. Pythagorean Theorem Proof 3D
// Represents a^2 + b^2 = c^2 visually with boxes
async function generatePythagorean() {
    const doc = createDocument();
    const scene = doc.createScene();

    // Triangle sides: a=3, b=4, c=5
    const a = 3, b = 4, c = 5;
    const unit = 0.5; // Scale down

    // Material Colors
    const colorA = [0.2, 0.6, 1.0]; // Blue
    const colorB = [1.0, 0.4, 0.4]; // Red
    const colorC = [0.6, 0.2, 0.8]; // Purple
    const colorTri = [0.9, 0.9, 0.9]; // White

    const mesh = doc.createMesh();
    
    // 1. Right Triangle (in xy plane)
    // Vertices: (0,0), (a,0), (0,b)
    // Extrude slightly to be 3D
    const depth = 0.2;
    const triVerts = new Float32Array([
        0,0,0,  a*unit,0,0,  0,b*unit,0, // Front
        0,0,-depth, a*unit,0,-depth, 0,b*unit,-depth // Back
    ]);
    const triIndices = new Uint16Array([
        0,1,2, 5,4,3, // Faces
        0,2,3, 3,2,5, // Side
        1,0,3, 3,4,1, // Bottom
        2,1,5, 5,1,4  // Hypotenuse side
    ]);
    // Note: manual indexing is tedious, simplification: just front face for visual or proper boxes
    // Let's use the createCubeArrays helper for cubes
    
    // Cube A (side a) - attached to side (0,b)-(0,0) -> Left side, going -x
    const cubeA = createCubeArrays([-a*unit, 0, 0], [0, a*unit, depth], colorA);
    const primA = createPrimitive(doc, cubeA.vertices, cubeA.indices, cubeA.colors);
    mesh.addPrimitive(primA);

    // Cube B (side b) - attached to side (0,0)-(a,0) -> Bottom side, going -y
    const cubeB = createCubeArrays([0, -b*unit, 0], [b*unit, 0, depth], colorB);
    const primB = createPrimitive(doc, cubeB.vertices, cubeB.indices, cubeB.colors);
    mesh.addPrimitive(primB);

    // Cube C (side c) - attached to hypotenuse
    // We need to rotate and position this box.
    // Instead of complex transforms, I'll just create a node for it and rotate the node.
    // Hypotenuse angle: tan(theta) = b/a
    const angle = Math.atan2(b, a); // Angle of hypotenuse from X axis
    // The square sits on the hypotenuse. 
    // Wait, standard proof arrangement:
    // Triangle at center. 
    // Box A on side 'b' (vertical)? No, standard is usually a horizontal, b vertical.
    // Let vertices be: C(0,0), A(b,0), B(0,a). 
    // Let's stick to a=3 (base), b=4 (height). C=5.
    // Vertices: (0,0), (3,0), (0,4).
    // Square on a: [0, -3] to [3, 0]
    // Square on b: [-4, 0] to [0, 4] -> No, attached to side 'b'.
    // If vertices are (0,0)-(3,0) (side a) and (0,0)-(0,4) (side b).
    // Square on a (bottom): y goes from 0 to -3. x from 0 to 3.
    // Square on b (left): x goes from -4 to 0. y from 0 to 4.
    // Square on c (hypotenuse): connects (3,0) and (0,4).
    
    // Re-do Triangle Mesh part
    const triMesh = doc.createMesh();
    // Simple flat triangle for the center
    const tV = [
        0,0,0, 3*unit,0,0, 0,4*unit,0, 
        0,0,depth, 3*unit,0,depth, 0,4*unit,depth
    ];
    // ... skipping manual triangulation for now, let's keep it simple style.
    // Actually, let's just make the "Square on Hypotenuse" as a separate object rotated.
    
    const nodeTri = doc.createNode().setName('Triangle');
    // Just a placeholder visual or simple lines?
    // Let's skip the triangle mesh and just have the 3 squares enclosing the void which IS the triangle.
    
    // Square A (Base) - Blue
    // Position: x=0..3, y=-3..0
    const nodeA = doc.createNode().setName('Square_A');
    const meshA = doc.createMesh();
    const dataA = createCubeArrays([0, -3*unit, 0], [3*unit, 0, depth], colorA);
    meshA.addPrimitive(createPrimitive(doc, dataA.vertices, dataA.indices, dataA.colors));
    nodeA.setMesh(meshA);
    scene.addChild(nodeA);

    // Square B (Height) - Red
    // Position: x=-4..0, y=0..4
    const nodeB = doc.createNode().setName('Square_B');
    const meshB = doc.createMesh();
    const dataB = createCubeArrays([-4*unit, 0, 0], [0, 4*unit, depth], colorB);
    meshB.addPrimitive(createPrimitive(doc, dataB.vertices, dataB.indices, dataB.colors));
    nodeB.setMesh(meshB);
    scene.addChild(nodeB);

    // Square C (Hypotenuse) - Purple
    // Side length 5.
    // It starts at (0, 4) and goes to (3, 0).
    // We need to construct a square `c*c` rotated.
    const nodeC = doc.createNode().setName('Square_C');
    const meshC = doc.createMesh();
    const dataC = createCubeArrays([0, 0, 0], [5*unit, 5*unit, depth], colorC);
    meshC.addPrimitive(createPrimitive(doc, dataC.vertices, dataC.indices, dataC.colors));
    
    // Rotation Calculation
    // Vector (0,4) to (3,0) is (3, -4).
    // Angle: atan2(-4, 3) = -53.13 deg.
    // We want the bottom-left of the square to be at (0,4) or top-left at (0,4)? 
    // The side of the triangle is the "bottom" of this square.
    // So we position the square at (0,4) and rotate it.
    // The rotation should align the square's x-axis with the vector (3, -4).
    
    const rotZ = Math.atan2(-4, 3); 
    // But wait, the square sits "above" the hypotenuse.
    // Normal to vector (3,-4) is (4,3).
    // Let's just create a node, translate to (0, 4*unit), rotate Z by angle.
    // Angle needs to be: -asin(4/5) ?
    // sin(theta) = 4/5. cos(theta) = 3/5.
    // The line goes down-right. The square should extend up-right perpendicular to it.
    
    nodeC.setMesh(meshC)
        .setTranslation([0, 4*unit, 0])
        .setRotation([0, 0, Math.sin(rotZ/2), Math.cos(rotZ/2)]); 
        // Quaternion from Euler Z. qx=0, qy=0, qz=sin(a/2), qw=cos(a/2)

    scene.addChild(nodeC);

    await saveGLB(doc, `3d-pythagorean-proof-${today}.glb`);
}

// 2. Archimedes' Sphere and Cylinder
// A sphere inscribed in a cylinder.
async function generateArchimedes() {
    const doc = createDocument();
    const scene = doc.createScene();

    const R = 1.5;
    const H = 2 * R;
    const segments = 32;
    
    // 1. Sphere
    const sphereVerts = [];
    const sphereIndices = [];
    const colorSphere = [1.0, 0.8, 0.2]; // Gold

    for(let lat=0; lat <= segments; lat++) {
        const theta = lat * Math.PI / segments;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);

        for(let lon=0; lon <= segments; lon++) {
            const phi = lon * 2 * Math.PI / segments;
            const x = R * cosTheta; // Standard math spherical (Z axis up) -> let's swap for Y-up
            // x = R sinT cosP
            // y = R cosT  <-- UP
            // z = R sinT sinP
            
            const y_pos = R * Math.cos(theta);
            const x_pos = R * Math.sin(theta) * Math.cos(phi);
            const z_pos = R * Math.sin(theta) * Math.sin(phi);
            
            sphereVerts.push(x_pos, y_pos, z_pos);
        }
    }

    for(let lat=0; lat < segments; lat++) {
        for(let lon=0; lon < segments; lon++) {
            const first = (lat * (segments + 1)) + lon;
            const second = first + segments + 1;
            sphereIndices.push(first, second, first + 1);
            sphereIndices.push(second, second + 1, first + 1);
        }
    }
    
    const meshSphere = doc.createMesh();
    // Create color array
    const cSphere = new Float32Array(sphereVerts.length).fill(0);
    for(let i=0; i<sphereVerts.length; i+=3) { cSphere[i]=colorSphere[0]; cSphere[i+1]=colorSphere[1]; cSphere[i+2]=colorSphere[2]; }
    
    meshSphere.addPrimitive(createPrimitive(doc, new Float32Array(sphereVerts), new Uint16Array(sphereIndices), cSphere));
    const nodeSphere = doc.createNode().setName('Sphere').setMesh(meshSphere);
    scene.addChild(nodeSphere);

    // 2. Cylinder (Wireframe or Transparent)
    // We'll make it a wireframe-like structure by using GL_LINES approximation or points, 
    // but gltf-transform helper above assumes triangles. 
    // Let's make a solid cylinder but with Alpha BLEND.
    // Note: This helper doesn't easily support materials/alpha yet.
    // We will make it a "Cut" cylinder or just rings.
    // Let's make top and bottom rings and 4 vertical pillars to represent the cylinder.
    
    const colorCyl = [0.2, 0.2, 0.2];
    const cylMesh = doc.createMesh();
    
    // Top Ring
    const ringVerts = [];
    for(let i=0; i<=64; i++) {
        const theta = (i/64)*Math.PI*2;
        ringVerts.push(R*Math.cos(theta), R, R*Math.sin(theta));
    }
    // Bottom Ring
    const ringVertsBot = [];
    for(let i=0; i<=64; i++) {
        const theta = (i/64)*Math.PI*2;
        ringVertsBot.push(R*Math.cos(theta), -R, R*Math.sin(theta));
    }
    
    // Since we only have triangles, we can make thin tubes for rings?
    // Too complex. Let's just make the Cylinder mesh with a different color (Blue-ish) and slightly larger
    // so it contains the sphere.
    // Actually, making it solid obscures the sphere.
    // Let's make a "Half Cylinder" or "Wireframe structure" manually.
    // Let's make 8 vertical bars around the perimeter.
    
    for(let i=0; i<8; i++) {
        const theta = (i/8)*Math.PI*2;
        const x = R * Math.cos(theta);
        const z = R * Math.sin(theta);
        // Bar from (x,-R,z) to (x,R,z)
        // Make it a thin cube
        const th = 0.05;
        const bar = createCubeArrays([x-th, -R, z-th], [x+th, R, z+th], [0.8, 0.8, 1.0]);
        cylMesh.addPrimitive(createPrimitive(doc, bar.vertices, bar.indices, bar.colors));
    }
    
    // Add top/bottom caps as thin plates? No, let's keep it open.
    const nodeCyl = doc.createNode().setName('CylinderFrame').setMesh(cylMesh);
    scene.addChild(nodeCyl);

    await saveGLB(doc, `3d-archimedes-sphere-cylinder-${today}.glb`);
}

// 3. Sierpinski Pyramid (Fractal)
async function generateSierpinski() {
    const doc = createDocument();
    const scene = doc.createScene();

    const pyramids = [];
    const maxLevel = 4;
    
    // Tetrahedron vertices
    // Base triangle in y=0 plane? Better centered.
    // V0=(1,1,1), V1=(1,-1,-1), V2=(-1,1,-1), V3=(-1,-1,1) -> Inscribe in cube
    // Let's use standard equiltateral tetrahedron logic relative to a center.
    const r = 2; // size
    const v0 = [0, r, 0];
    const angle = (2 * Math.PI) / 3;
    const baseR = r * Math.sqrt(8/9); // height geometry
    const loweredY = -r / 3;
    
    const v1 = [baseR, loweredY, 0];
    const v2 = [baseR * Math.cos(angle), loweredY, baseR * Math.sin(angle)];
    const v3 = [baseR * Math.cos(2*angle), loweredY, baseR * Math.sin(2*angle)];

    const color = [0.1, 0.8, 0.5]; // Emerald Green

    function addTetrahedron(center, scale, level) {
        if (level === 0) {
            // Add geometry
            const s = scale;
            const p0href = [v0[0]*s, v0[1]*s, v0[2]*s];
            const p1 = [v1[0]*s, v1[1]*s, v1[2]*s];
            const p2 = [v2[0]*s, v2[1]*s, v2[2]*s];
            const p3 = [v3[0]*s, v3[1]*s, v3[2]*s];
            
            // Shift by center
            const shift = (p) => [p[0]+center[0], p[1]+center[1], p[2]+center[2]];
            const finalV = [shift(p0href), shift(p1), shift(p2), shift(p3)];
            
            // 4 Faces
            // 0-1-2, 0-2-3, 0-3-1, 1-3-2 (Base)
            // Ensure winding order for CCW
            const verts = [
                ...finalV[0], ...finalV[1], ...finalV[2],
                ...finalV[0], ...finalV[2], ...finalV[3],
                ...finalV[0], ...finalV[3], ...finalV[1],
                ...finalV[1], ...finalV[3], ...finalV[2]
            ];
            
            pyramids.push(...verts);
            return;
        }

        const nextScale = scale / 2;
        // Offsets for 4 sub-tetrahedrons are half the vectors to vertices
        // But relative to the current center?
        // Actually, if corners are at vector V from center, new centers are Center + V/2
        
        // P0' = C + V0/2
        // P1' = C + V1/2 ...
        
        const offsets = [v0, v1, v2, v3];
        for(let i=0; i<4; i++) {
            const nextCenter = [
                center[0] + offsets[i][0] * scale / 2, // Check math
                center[1] + offsets[i][1] * scale / 2,
                center[2] + offsets[i][2] * scale / 2
            ];
            // Wait, this assumes the 'scale' parameter is linear 1.0->0.5.
            // If v0 is length R, v0*scale is current vertex offset.
            // New center is at (CurrentCenter + CurrentVertex)/2 = CurrentCenter + CurrentVertexOffset/2.
            // Yes.
            addTetrahedron(nextCenter, nextScale, level - 1);
        }
    }

    addTetrahedron([0,0,0], 1.0, maxLevel);

    const positions = new Float32Array(pyramids);
    const indices = new Uint16Array(pyramids.length / 3);
    for(let i=0; i<indices.length; i++) indices[i] = i;
    
    // Per vertex color
    const colors = new Float32Array(pyramids.length).fill(0);
    for(let i=0; i<colors.length; i+=3) { colors[i]=color[0]; colors[i+1]=color[1]; colors[i+2]=color[2]; }

    const mesh = doc.createMesh();
    mesh.addPrimitive(createPrimitive(doc, positions, indices, colors));
    scene.addChild(doc.createNode().setName('Sierpinski').setMesh(mesh));

    await saveGLB(doc, `3d-fractal-sierpinski-pyramid-${today}.glb`);
}

// 4. Euler's Helix (Complex Plane)
// 3D plot of e^(ix) = cos(x) + i*sin(x)
// x axis is 'x' (time/angle), y is Real, z is Imaginary
async function generateEulerHelix() {
    const doc = createDocument();
    const scene = doc.createScene();

    const points = [];
    const length = 4 * Math.PI; // 2 cycles
    const segments = 200;
    const radius = 0.1; // Tube radius

    const spinePoints = [];
    for(let i=0; i<=segments; i++) {
        const t = (i/segments) * length;
        // x-axis maps to t
        // y = cos(t)
        // z = sin(t)
        spinePoints.push([t - length/2, Math.cos(t), Math.sin(t)]);
    }

    // Generate Tube mesh along spine
    // Simple tube generation
    const tubeVerts = [];
    const tubeIndices = [];
    const radialSegs = 12;

    for (let i = 0; i <= segments; i++) {
        const [cx, cy, cz] = spinePoints[i];
        
        // Calculate frame? Simple fixed up vector usually fails.
        // Since it's a helix along X, tangent is roughly (1, -sin, cos).
        // Let's just create a ring in the YZ plane and rotate it?
        // No, the cross section should be perpendicular to tangent.
        // Tangent T
        // T ~ (1, -sin(t), cos(t)) normalized
        // Let's approximate: Just place rings in YZ plane added to Cx.
        // It's "good enough" for visualization if slope isn't too high.
        // x is dominant (scale x by factor?)
        
        for (let j = 0; j <= radialSegs; j++) {
            const v = (j / radialSegs) * Math.PI * 2;
            // Circle in local YZ plane? 
            // We want circle perpendicular to X axis mostly.
            const ry = radius * Math.cos(v);
            const rz = radius * Math.sin(v);
            
            tubeVerts.push(cx, cy + ry, cz + rz); 
        }
    }

    const cols = radialSegs + 1;
    for (let i = 0; i < segments; i++) {
        for (let j = 0; j < radialSegs; j++) {
            const a = i * cols + j;
            const b = a + 1;
            const c = (i + 1) * cols + j;
            const d = c + 1;
            tubeIndices.push(a, b, c, b, d, c);
        }
    }

    // Color gradient along X?
    const colors = new Float32Array(tubeVerts.length).fill(1); // White default
    // Let's make it rainbow along T?
    for(let i=0; i<tubeVerts.length; i+=3) {
        const x = tubeVerts[i];
        const t = (x + length/2) / length; // 0 to 1
        // Simple RGB gradient
        colors[i] = t; // R
        colors[i+1] = 1-t; // G
        colors[i+2] = 0.5; // B
    }

    const mesh = doc.createMesh();
    mesh.addPrimitive(createPrimitive(doc, new Float32Array(tubeVerts), new Uint16Array(tubeIndices), colors));
    scene.addChild(doc.createNode().setName('EulerHelix').setMesh(mesh));

    // Add Axes?
    // Main Axis (X) -> Real/Time line
    const axisMesh = doc.createMesh();
    // X axis Line
    const axisX = createCubeArrays([-length/2, 0, 0], [length/2, 0, 0], [0.5,0.5,0.5]); // invalid flat cube?
    // Make thin box
    const thin = 0.02;
    const ax = createCubeArrays([-length/2, -thin, -thin], [length/2, thin, thin], [0.8, 0.8, 0.8]);
    axisMesh.addPrimitive(createPrimitive(doc, ax.vertices, ax.indices, ax.colors));
    scene.addChild(doc.createNode().setName('Axis').setMesh(axisMesh));

    await saveGLB(doc, `3d-euler-helix-complex-${today}.glb`);
}

// 5. Platonic Icosahedron (Water Element)
// Reliable generation without external dependencies
async function generateIcosahedron() {
    console.log("Generating Icosahedron...");
    const doc = createDocument();
    const scene = doc.createScene();

    const t = (1 + Math.sqrt(5)) / 2;

    // 12 Vertices
    // (0, ±1, ±t)
    // (±1, ±t, 0)
    // (±t, 0, ±1)
    
    const verts = [
        0, 1, t,   0, 1, -t,  0, -1, t,  0, -1, -t,
        1, t, 0,   1, -t, 0,  -1, t, 0,  -1, -t, 0,
        t, 0, 1,   t, 0, -1,  -t, 0, 1,  -t, 0, -1
    ];
    
    // Normalize vertices to radius 1
    for(let i=0; i<verts.length; i+=3) {
        const x=verts[i], y=verts[i+1], z=verts[i+2];
        const len = Math.sqrt(x*x + y*y + z*z);
        verts[i]/=len; verts[i+1]/=len; verts[i+2]/=len;
    }

    // Indices (20 triangles)
    const indices = [
        0, 8, 4,  0, 5, 10,  2, 4, 8,  2, 10, 5,
        3, 2, 5,  3, 7, 11,  1, 3, 11, 1, 9, 6,
        0, 4, 1,  0, 10, 2,  8, 6, 9,  8, 4, 6,
        10, 5, 11, 10, 11, 7, 4, 2, 8,  // Wait, indices need to be carefully mapped.
        // Let's use the explicit set from previous successful script
    ];
    
    // Re-mapped from previous file which worked:
    // Verts in previous file were slightly different order.
    // Let's use that exact code block for reliability.
    
    // Previous Code Logic:
    const X = 0.525731112119133606;
    const Z = 0.850650808352039932;
    
    const icoVerts = new Float32Array([
        -X, 0.0, Z,  X, 0.0, Z,  -X, 0.0, -Z,  X, 0.0, -Z,
        0.0, Z, X,   0.0, Z, -X, 0.0, -Z, X,   0.0, -Z, -X,
        Z, X, 0.0,   -Z, X, 0.0, Z, -X, 0.0,   -Z, -X, 0.0
    ]);
    
    const icoIndices = new Uint16Array([
        1,4,0,  4,9,0,  4,5,9,  8,5,4,  1,8,4,
        1,10,8, 10,3,8, 8,3,5,  3,2,5,  3,7,2,
        3,10,7, 10,6,7, 6,11,7, 6,0,11, 6,1,0,
        10,1,6, 11,0,9, 2,11,9, 5,2,9,  11,2,7
    ]);
    
    const colors = new Float32Array(icoVerts.length).fill(0);
    // Cyan color
    for(let i=0; i<colors.length; i+=3) { colors[i]=0.0; colors[i+1]=0.8; colors[i+2]=1.0; }

    const mesh = doc.createMesh();
    mesh.addPrimitive(createPrimitive(doc, icoVerts, icoIndices, colors));
    
    const node = doc.createNode().setMesh(mesh).setName('Icosahedron');
    scene.addChild(node);

    await saveGLB(doc, `3d-platonic-icosahedron-${today}.glb`);
}

// Run all
(async () => {
    try {
        console.log("Starting generation...");
        console.log("1. Pythagorean...");
        await generatePythagorean();
        console.log("2. Archimedes...");
        await generateArchimedes();
        console.log("3. Sierpinski...");
        await generateSierpinski();
        console.log("4. Euler...");
        await generateEulerHelix();
        console.log("5. Icosahedron...");
        await generateIcosahedron(); // Replaced Dodecahedron
        console.log("All 3D assets generated successfully.");
    } catch (e) {
        console.error("Error generating assets:", e);
    }
})();
