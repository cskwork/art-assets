import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Document, NodeIO } from '@gltf-transform/core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
async function generatePythagorean() {
    const doc = createDocument();
    const scene = doc.createScene();
    const a = 3, b = 4, c = 5;
    const unit = 0.5; 
    const depth = 0.2;
    const colorA = [0.2, 0.6, 1.0]; 
    const colorB = [1.0, 0.4, 0.4]; 
    const colorC = [0.6, 0.2, 0.8]; 

    // Square A (Base)
    const nodeA = doc.createNode().setName('Square_A');
    const meshA = doc.createMesh();
    const dataA = createCubeArrays([0, -3*unit, 0], [3*unit, 0, depth], colorA);
    meshA.addPrimitive(createPrimitive(doc, dataA.vertices, dataA.indices, dataA.colors));
    nodeA.setMesh(meshA);
    scene.addChild(nodeA);

    // Square B (Height)
    const nodeB = doc.createNode().setName('Square_B');
    const meshB = doc.createMesh();
    const dataB = createCubeArrays([-4*unit, 0, 0], [0, 4*unit, depth], colorB);
    meshB.addPrimitive(createPrimitive(doc, dataB.vertices, dataB.indices, dataB.colors));
    nodeB.setMesh(meshB);
    scene.addChild(nodeB);

    // Square C (Hypotenuse)
    const nodeC = doc.createNode().setName('Square_C');
    const meshC = doc.createMesh();
    const dataC = createCubeArrays([0, 0, 0], [5*unit, 5*unit, depth], colorC);
    meshC.addPrimitive(createPrimitive(doc, dataC.vertices, dataC.indices, dataC.colors));
    
    const rotZ = Math.atan2(-4, 3); 
    
    nodeC.setMesh(meshC)
        .setTranslation([0, 4*unit, 0])
        .setRotation([0, 0, Math.sin(rotZ/2), Math.cos(rotZ/2)]); 

    scene.addChild(nodeC);
    await saveGLB(doc, `3d-pythagorean-proof-${today}.glb`);
}

// 2. Archimedes' Sphere and Cylinder
async function generateArchimedes() {
    const doc = createDocument();
    const scene = doc.createScene();
    const R = 1.5;
    const segments = 32;
    // Sphere
    const sphereVerts = [];
    const sphereIndices = [];
    const colorSphere = [1.0, 0.8, 0.2]; 

    for(let lat=0; lat <= segments; lat++) {
        const theta = lat * Math.PI / segments;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);
        for(let lon=0; lon <= segments; lon++) {
            const phi = lon * 2 * Math.PI / segments;
            const x = R * sinTheta * Math.cos(phi);
            const y = R * cosTheta;
            const z = R * sinTheta * Math.sin(phi);
            sphereVerts.push(x, y, z);
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
    const cSphere = new Float32Array(sphereVerts.length).fill(0);
    for(let i=0; i<sphereVerts.length; i+=3) { cSphere[i]=colorSphere[0]; cSphere[i+1]=colorSphere[1]; cSphere[i+2]=colorSphere[2]; }
    meshSphere.addPrimitive(createPrimitive(doc, new Float32Array(sphereVerts), new Uint16Array(sphereIndices), cSphere));
    scene.addChild(doc.createNode().setName('Sphere').setMesh(meshSphere));

    // Cylinder Frame
    const cylMesh = doc.createMesh();
    for(let i=0; i<8; i++) {
        const theta = (i/8)*Math.PI*2;
        const x = R * Math.cos(theta);
        const z = R * Math.sin(theta);
        const th = 0.05;
        const bar = createCubeArrays([x-th, -R, z-th], [x+th, R, z+th], [0.8, 0.8, 1.0]);
        cylMesh.addPrimitive(createPrimitive(doc, bar.vertices, bar.indices, bar.colors));
    }
    scene.addChild(doc.createNode().setName('CylinderFrame').setMesh(cylMesh));
    await saveGLB(doc, `3d-archimedes-sphere-cylinder-${today}.glb`);
}

// 3. Sierpinski Pyramid
async function generateSierpinski() {
    const doc = createDocument();
    const scene = doc.createScene();
    const pyramids = [];
    const maxLevel = 4;
    const r = 2; 
    const v0 = [0, r, 0];
    const angle = (2 * Math.PI) / 3;
    const baseR = r * Math.sqrt(8/9); 
    const loweredY = -r / 3;
    const v1 = [baseR, loweredY, 0];
    const v2 = [baseR * Math.cos(angle), loweredY, baseR * Math.sin(angle)];
    const v3 = [baseR * Math.cos(2*angle), loweredY, baseR * Math.sin(2*angle)];
    const color = [0.1, 0.8, 0.5]; 

    function addTetrahedron(center, scale, level) {
        if (level === 0) {
            const s = scale;
            const p0href = [v0[0]*s, v0[1]*s, v0[2]*s];
            const p1 = [v1[0]*s, v1[1]*s, v1[2]*s];
            const p2 = [v2[0]*s, v2[1]*s, v2[2]*s];
            const p3 = [v3[0]*s, v3[1]*s, v3[2]*s];
            
            const shift = (p) => [p[0]+center[0], p[1]+center[1], p[2]+center[2]];
            const finalV = [shift(p0href), shift(p1), shift(p2), shift(p3)];
            
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
        const offsets = [v0, v1, v2, v3];
        for(let i=0; i<4; i++) {
            const nextCenter = [
                center[0] + offsets[i][0] * scale / 2, 
                center[1] + offsets[i][1] * scale / 2,
                center[2] + offsets[i][2] * scale / 2
            ];
            addTetrahedron(nextCenter, nextScale, level - 1);
        }
    }
    addTetrahedron([0,0,0], 1.0, maxLevel);
    const positions = new Float32Array(pyramids);
    const indices = new Uint16Array(pyramids.length / 3);
    for(let i=0; i<indices.length; i++) indices[i] = i;
    const colors = new Float32Array(pyramids.length).fill(0);
    for(let i=0; i<colors.length; i+=3) { colors[i]=color[0]; colors[i+1]=color[1]; colors[i+2]=color[2]; }
    const mesh = doc.createMesh();
    mesh.addPrimitive(createPrimitive(doc, positions, indices, colors));
    scene.addChild(doc.createNode().setName('Sierpinski').setMesh(mesh));
    await saveGLB(doc, `3d-fractal-sierpinski-pyramid-${today}.glb`);
}

// 4. Euler's Helix
async function generateEulerHelix() {
    const doc = createDocument();
    const scene = doc.createScene();
    const length = 4 * Math.PI; 
    const segments = 200;
    const radius = 0.1; 
    const spinePoints = [];
    for(let i=0; i<=segments; i++) {
        const t = (i/segments) * length;
        spinePoints.push([t - length/2, Math.cos(t), Math.sin(t)]);
    }
    const tubeVerts = [];
    const tubeIndices = [];
    const radialSegs = 12;

    for (let i = 0; i <= segments; i++) {
        const [cx, cy, cz] = spinePoints[i];
        for (let j = 0; j <= radialSegs; j++) {
            const v = (j / radialSegs) * Math.PI * 2;
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
    const colors = new Float32Array(tubeVerts.length).fill(1); 
    for(let i=0; i<tubeVerts.length; i+=3) {
        const x = tubeVerts[i];
        const t = (x + length/2) / length; 
        colors[i] = t; colors[i+1] = 1-t; colors[i+2] = 0.5; 
    }
    const mesh = doc.createMesh();
    mesh.addPrimitive(createPrimitive(doc, new Float32Array(tubeVerts), new Uint16Array(tubeIndices), colors));
    scene.addChild(doc.createNode().setName('EulerHelix').setMesh(mesh));

    const axisMesh = doc.createMesh();
    const thin = 0.02;
    const ax = createCubeArrays([-length/2, -thin, -thin], [length/2, thin, thin], [0.8, 0.8, 0.8]);
    axisMesh.addPrimitive(createPrimitive(doc, ax.vertices, ax.indices, ax.colors));
    scene.addChild(doc.createNode().setName('Axis').setMesh(axisMesh));

    await saveGLB(doc, `3d-euler-helix-complex-${today}.glb`);
}

// 5. Icosahedron
async function generateIcosahedron() {
    console.log("Generating Icosahedron...");
    const doc = createDocument();
    const scene = doc.createScene();
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
    for(let i=0; i<colors.length; i+=3) { colors[i]=0.0; colors[i+1]=0.8; colors[i+2]=1.0; }
    const mesh = doc.createMesh();
    mesh.addPrimitive(createPrimitive(doc, icoVerts, icoIndices, colors));
    scene.addChild(doc.createNode().setMesh(mesh).setName('Icosahedron'));
    await saveGLB(doc, `3d-platonic-icosahedron-${today}.glb`);
}

// Run ALL
(async () => {
    try {
        console.log("Starting generation (ESM)...");
        console.log("1. Pythagorean...");
        await generatePythagorean();
        console.log("2. Archimedes...");
        await generateArchimedes();
        console.log("3. Sierpinski...");
        await generateSierpinski();
        console.log("4. Euler...");
        await generateEulerHelix();
        console.log("5. Icosahedron...");
        await generateIcosahedron();
        console.log("All 3D assets generated successfully.");
    } catch (e) {
        console.error("Error generating assets:", e);
    }
})();
