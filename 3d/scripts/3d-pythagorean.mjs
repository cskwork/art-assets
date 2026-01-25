import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Document, NodeIO } from '@gltf-transform/core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_DIR = path.resolve(__dirname, '..'); 
const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
const io = new NodeIO();

function createPrimitive(doc, vertices, indices, colors = null) {
    const buffer = doc.createBuffer();
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
    console.log("Generating Pythagorean...");
    const doc = new Document();
    const scene = doc.createScene();
    const unit = 0.5; const depth = 0.2;
    const colorA = [0.2, 0.6, 1.0]; const colorB = [1.0, 0.4, 0.4]; const colorC = [0.6, 0.2, 0.8]; 

    const nodeA = doc.createNode().setName('Square_A');
    const meshA = doc.createMesh();
    const dataA = createCubeArrays([0, -3*unit, 0], [3*unit, 0, depth], colorA);
    meshA.addPrimitive(createPrimitive(doc, dataA.vertices, dataA.indices, dataA.colors));
    nodeA.setMesh(meshA);
    scene.addChild(nodeA);

    const nodeB = doc.createNode().setName('Square_B');
    const meshB = doc.createMesh();
    const dataB = createCubeArrays([-4*unit, 0, 0], [0, 4*unit, depth], colorB);
    meshB.addPrimitive(createPrimitive(doc, dataB.vertices, dataB.indices, dataB.colors));
    nodeB.setMesh(meshB);
    scene.addChild(nodeB);

    const nodeC = doc.createNode().setName('Square_C');
    const meshC = doc.createMesh();
    const dataC = createCubeArrays([0, 0, 0], [5*unit, 5*unit, depth], colorC);
    meshC.addPrimitive(createPrimitive(doc, dataC.vertices, dataC.indices, dataC.colors));
    
    // Manual rotation components to avoid Math.sin possibly crashing? (unlikely)
    // -53.13 deg -> rad = -0.927
    // sin(-0.46) = -0.44. cos = 0.89.
    const rotZ = Math.atan2(-4, 3);
    nodeC.setMesh(meshC).setTranslation([0, 4*unit, 0]).setRotation([0, 0, Math.sin(rotZ/2), Math.cos(rotZ/2)]); 
    scene.addChild(nodeC);

    const buffer = await io.writeBinary(doc);
    fs.writeFileSync(path.join(OUTPUT_DIR, `3d-pythagorean-proof-${today}.glb`), buffer);
    console.log("Done.");
}

run().catch(e => console.error(e));
