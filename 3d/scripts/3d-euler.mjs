import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Document, NodeIO } from '@gltf-transform/core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_DIR = path.resolve(__dirname, '..'); 
const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
const dateStamp = process.env.ASSET_DATE || today;
const io = new NodeIO();

function createPrimitive(doc, buffer, vertices, indices, colors = null) {
    const position = doc.createAccessor().setArray(vertices).setType('VEC3').setBuffer(buffer);
    const primitive = doc.createPrimitive().setAttribute('POSITION', position);
    primitive.setIndices(doc.createAccessor().setArray(indices).setType('SCALAR').setBuffer(buffer));
    if (colors) {
        primitive.setAttribute('COLOR_0', doc.createAccessor().setArray(colors).setType('VEC3').setBuffer(buffer));
    }
    return primitive;
}

function createCubeArrays(min, max, color) {
    const [x1, y1, z1] = min;
    const [x2, y2, z2] = max;
    const rawVerts = [
      x1, y1, z2,  x2, y1, z2,  x2, y2, z2,  x1, y2, z2,
      x2, y1, z1,  x1, y1, z1,  x1, y2, z1,  x2, y2, z1,
      x1, y2, z2,  x2, y2, z2,  x2, y2, z1,  x1, y2, z1,
      x1, y1, z1,  x2, y1, z1,  x2, y1, z2,  x1, y1, z2,
      x2, y1, z2,  x2, y1, z1,  x2, y2, z1,  x2, y2, z2,
      x1, y1, z1,  x1, y1, z2,  x1, y2, z2,  x1, y2, z1
    ];
    const vertices = new Float32Array(rawVerts);
    const colors = new Float32Array(24 * 3);
    for(let i=0; i<24; i++) { colors[i*3] = color[0]; colors[i*3+1] = color[1]; colors[i*3+2] = color[2]; }
    const indices = new Uint16Array(36);
    let idx = 0;
    for(let i=0; i<6; i++) {
        const base = i*4;
        indices[idx++] = base; indices[idx++] = base+1; indices[idx++] = base+2;
        indices[idx++] = base; indices[idx++] = base+2; indices[idx++] = base+3;
    }
    return { vertices, indices, colors };
}

async function run() {
    console.log("Generating Euler Helix...");
    const doc = new Document();
    const scene = doc.createScene();
    const buffer = doc.createBuffer();
    const length = 4 * Math.PI; const segments = 200; const radius = 0.1; 
    const spinePoints = [];
    for(let i=0; i<=segments; i++) {
        const t = (i/segments) * length;
        spinePoints.push([t - length/2, Math.cos(t), Math.sin(t)]);
    }
    const tubeVerts = []; const tubeIndices = []; const radialSegs = 12;
    for (let i = 0; i <= segments; i++) {
        const [cx, cy, cz] = spinePoints[i];
        for (let j = 0; j <= radialSegs; j++) {
            const v = (j / radialSegs) * Math.PI * 2;
            tubeVerts.push(cx, cy + radius * Math.cos(v), cz + radius * Math.sin(v)); 
        }
    }
    const cols = radialSegs + 1;
    for (let i = 0; i < segments; i++) {
        for (let j = 0; j < radialSegs; j++) {
            const a = i * cols + j; const b = a + 1; const c = (i + 1) * cols + j; const d = c + 1;
            tubeIndices.push(a, b, c, b, d, c);
        }
    }
    const colors = new Float32Array(tubeVerts.length).fill(1.0); 
    for(let i=0; i<tubeVerts.length; i+=3) {
        const x = tubeVerts[i]; const t = (x + length/2) / length; 
        colors[i] = t; colors[i+1] = 1-t; colors[i+2] = 0.5; 
    }
    const mesh = doc.createMesh();
    mesh.addPrimitive(createPrimitive(doc, buffer, new Float32Array(tubeVerts), new Uint16Array(tubeIndices), colors));
    scene.addChild(doc.createNode().setName('EulerHelix').setMesh(mesh));
    const axisMesh = doc.createMesh();
    const ax = createCubeArrays([-length/2, -0.02, -0.02], [length/2, 0.02, 0.02], [0.8, 0.8, 0.8]);
    axisMesh.addPrimitive(createPrimitive(doc, buffer, ax.vertices, ax.indices, ax.colors));
    scene.addChild(doc.createNode().setName('Axis').setMesh(axisMesh));
    
    const glbBuffer = await io.writeBinary(doc);
    fs.writeFileSync(path.join(OUTPUT_DIR, `3d-euler-helix-complex-${dateStamp}.glb`), glbBuffer);
    console.log("Done.");
}

run().catch(e => console.error(e));
