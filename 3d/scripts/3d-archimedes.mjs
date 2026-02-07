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
    console.log("Generating Archimedes...");
    const doc = new Document();
    const scene = doc.createScene();
    const buffer = doc.createBuffer();
    const R = 1.5; const segments = 32;
    const sphereVerts = []; const sphereIndices = []; const colorSphere = [1.0, 0.8, 0.2]; 

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
    meshSphere.addPrimitive(createPrimitive(doc, buffer, new Float32Array(sphereVerts), new Uint16Array(sphereIndices), cSphere));
    scene.addChild(doc.createNode().setName('Sphere').setMesh(meshSphere));

    const cylMesh = doc.createMesh();
    for(let i=0; i<8; i++) {
        const theta = (i/8)*Math.PI*2;
        const x = R * Math.cos(theta);
        const z = R * Math.sin(theta);
        const th = 0.05;
        const bar = createCubeArrays([x-th, -R, z-th], [x+th, R, z+th], [0.8, 0.8, 1.0]);
        cylMesh.addPrimitive(createPrimitive(doc, buffer, bar.vertices, bar.indices, bar.colors));
    }
    scene.addChild(doc.createNode().setName('CylinderFrame').setMesh(cylMesh));
    
    const glbBuffer = await io.writeBinary(doc);
    fs.writeFileSync(path.join(OUTPUT_DIR, `3d-archimedes-sphere-cylinder-${dateStamp}.glb`), glbBuffer);
    console.log("Done.");
}

run().catch(e => console.error(e));
