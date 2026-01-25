/**
 * 초등학교 수학용 3D 에셋 생성 스크립트
 * 대상: 초등학생 (Elementary level)
 * 내용: 기본 입체도형, 세기 도구, 분수 시각화
 */

const fs = require('fs');
const path = require('path');
const { Document, NodeIO } = require('@gltf-transform/core');

const OUTPUT_DIR = path.resolve(__dirname, '..');
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
const io = new NodeIO();

async function saveGLB(doc, filename) {
    const buffer = await io.writeBinary(doc);
    const outputPath = path.join(OUTPUT_DIR, filename);
    fs.writeFileSync(outputPath, buffer);
    console.log(`Generated: ${outputPath}`);
}

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

// 1. 구 (Sphere) - 기본 입체도형
async function generateSphere() {
    const doc = createDocument();
    const scene = doc.createScene();

    const radius = 1;
    const latSegments = 16;
    const lonSegments = 24;

    const vertices = [];
    const indices = [];
    const colors = [];

    // 빨간색 구
    const color = [0.9, 0.3, 0.3];

    for (let lat = 0; lat <= latSegments; lat++) {
        const theta = (lat / latSegments) * Math.PI;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);

        for (let lon = 0; lon <= lonSegments; lon++) {
            const phi = (lon / lonSegments) * Math.PI * 2;
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);

            const x = cosPhi * sinTheta * radius;
            const y = cosTheta * radius;
            const z = sinPhi * sinTheta * radius;

            vertices.push(x, y, z);
            colors.push(...color);
        }
    }

    const cols = lonSegments + 1;
    for (let lat = 0; lat < latSegments; lat++) {
        for (let lon = 0; lon < lonSegments; lon++) {
            const a = lat * cols + lon;
            const b = a + 1;
            const c = (lat + 1) * cols + lon;
            const d = c + 1;

            indices.push(a, c, b);
            indices.push(b, c, d);
        }
    }

    const mesh = doc.createMesh();
    mesh.addPrimitive(createPrimitive(doc, new Float32Array(vertices), new Uint16Array(indices), new Float32Array(colors)));
    scene.addChild(doc.createNode().setMesh(mesh).setName('Sphere'));

    await saveGLB(doc, `3d-elementary-sphere-red-${today}.glb`);
}

// 2. 원기둥 (Cylinder)
async function generateCylinder() {
    const doc = createDocument();
    const scene = doc.createScene();

    const radius = 0.8;
    const height = 2;
    const segments = 24;

    const vertices = [];
    const indices = [];
    const colors = [];

    // 파란색
    const color = [0.3, 0.5, 0.9];

    // 윗면 중심
    const topCenterIdx = 0;
    vertices.push(0, height / 2, 0);
    colors.push(...color);

    // 아랫면 중심
    const bottomCenterIdx = 1;
    vertices.push(0, -height / 2, 0);
    colors.push(...color);

    // 옆면 + 상하면 정점
    for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        // 윗면 테두리
        vertices.push(x, height / 2, z);
        colors.push(...color);
        // 아랫면 테두리
        vertices.push(x, -height / 2, z);
        colors.push(...color);
    }

    // 윗면 삼각형
    for (let i = 0; i < segments; i++) {
        const topIdx = 2 + i * 2;
        const topNextIdx = 2 + ((i + 1) % (segments + 1)) * 2;
        indices.push(topCenterIdx, topNextIdx, topIdx);
    }

    // 아랫면 삼각형
    for (let i = 0; i < segments; i++) {
        const bottomIdx = 3 + i * 2;
        const bottomNextIdx = 3 + ((i + 1) % (segments + 1)) * 2;
        indices.push(bottomCenterIdx, bottomIdx, bottomNextIdx);
    }

    // 옆면 삼각형
    for (let i = 0; i < segments; i++) {
        const topIdx = 2 + i * 2;
        const bottomIdx = 3 + i * 2;
        const topNextIdx = 2 + (i + 1) * 2;
        const bottomNextIdx = 3 + (i + 1) * 2;

        indices.push(topIdx, bottomIdx, bottomNextIdx);
        indices.push(topIdx, bottomNextIdx, topNextIdx);
    }

    const mesh = doc.createMesh();
    mesh.addPrimitive(createPrimitive(doc, new Float32Array(vertices), new Uint16Array(indices), new Float32Array(colors)));
    scene.addChild(doc.createNode().setMesh(mesh).setName('Cylinder'));

    await saveGLB(doc, `3d-elementary-cylinder-blue-${today}.glb`);
}

// 3. 원뿔 (Cone)
async function generateCone() {
    const doc = createDocument();
    const scene = doc.createScene();

    const radius = 1;
    const height = 2;
    const segments = 24;

    const vertices = [];
    const indices = [];
    const colors = [];

    // 노란색
    const color = [0.95, 0.8, 0.2];

    // 꼭짓점
    vertices.push(0, height / 2, 0);
    colors.push(...color);

    // 밑면 중심
    vertices.push(0, -height / 2, 0);
    colors.push(...color);

    // 밑면 테두리
    for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        vertices.push(x, -height / 2, z);
        colors.push(...color);
    }

    // 옆면 삼각형
    for (let i = 0; i < segments; i++) {
        const baseIdx = 2 + i;
        const baseNextIdx = 2 + i + 1;
        indices.push(0, baseNextIdx, baseIdx);
    }

    // 밑면 삼각형
    for (let i = 0; i < segments; i++) {
        const baseIdx = 2 + i;
        const baseNextIdx = 2 + i + 1;
        indices.push(1, baseIdx, baseNextIdx);
    }

    const mesh = doc.createMesh();
    mesh.addPrimitive(createPrimitive(doc, new Float32Array(vertices), new Uint16Array(indices), new Float32Array(colors)));
    scene.addChild(doc.createNode().setMesh(mesh).setName('Cone'));

    await saveGLB(doc, `3d-elementary-cone-yellow-${today}.glb`);
}

// 4. 직육면체 (Rectangular Prism / Box)
async function generateBox() {
    const doc = createDocument();
    const scene = doc.createScene();

    const w = 1.5, h = 1, d = 2; // 가로, 세로, 깊이
    const hw = w / 2, hh = h / 2, hd = d / 2;

    // 녹색
    const color = [0.3, 0.8, 0.4];

    // 8개 정점
    const verts = [
        [-hw, -hh, -hd], [hw, -hh, -hd], [hw, hh, -hd], [-hw, hh, -hd], // 앞면
        [-hw, -hh, hd], [hw, -hh, hd], [hw, hh, hd], [-hw, hh, hd]      // 뒷면
    ];

    // 6개 면 (각 면 2개 삼각형)
    const faces = [
        [0, 1, 2, 3], // 앞
        [5, 4, 7, 6], // 뒤
        [4, 0, 3, 7], // 왼쪽
        [1, 5, 6, 2], // 오른쪽
        [3, 2, 6, 7], // 위
        [4, 5, 1, 0]  // 아래
    ];

    const vertices = [];
    const indices = [];
    const colors = [];

    for (const face of faces) {
        const baseIdx = vertices.length / 3;
        for (const vi of face) {
            vertices.push(...verts[vi]);
            colors.push(...color);
        }
        indices.push(baseIdx, baseIdx + 1, baseIdx + 2);
        indices.push(baseIdx, baseIdx + 2, baseIdx + 3);
    }

    const mesh = doc.createMesh();
    mesh.addPrimitive(createPrimitive(doc, new Float32Array(vertices), new Uint16Array(indices), new Float32Array(colors)));
    scene.addChild(doc.createNode().setMesh(mesh).setName('RectangularPrism'));

    await saveGLB(doc, `3d-elementary-box-green-${today}.glb`);
}

// 5. 사각뿔 (Square Pyramid)
async function generatePyramid() {
    const doc = createDocument();
    const scene = doc.createScene();

    const baseSize = 1.5;
    const height = 2;
    const hb = baseSize / 2;

    // 보라색
    const color = [0.6, 0.3, 0.8];

    const apex = [0, height / 2, 0];
    const base = [
        [-hb, -height / 2, -hb],
        [hb, -height / 2, -hb],
        [hb, -height / 2, hb],
        [-hb, -height / 2, hb]
    ];

    const vertices = [];
    const indices = [];
    const colors = [];

    // 4개 옆면
    const sideFaces = [
        [apex, base[0], base[1]],
        [apex, base[1], base[2]],
        [apex, base[2], base[3]],
        [apex, base[3], base[0]]
    ];

    for (const face of sideFaces) {
        const baseIdx = vertices.length / 3;
        for (const v of face) {
            vertices.push(...v);
            colors.push(...color);
        }
        indices.push(baseIdx, baseIdx + 1, baseIdx + 2);
    }

    // 밑면 (2개 삼각형)
    const bottomBaseIdx = vertices.length / 3;
    for (const v of base) {
        vertices.push(...v);
        colors.push(...color);
    }
    indices.push(bottomBaseIdx, bottomBaseIdx + 2, bottomBaseIdx + 1);
    indices.push(bottomBaseIdx, bottomBaseIdx + 3, bottomBaseIdx + 2);

    const mesh = doc.createMesh();
    mesh.addPrimitive(createPrimitive(doc, new Float32Array(vertices), new Uint16Array(indices), new Float32Array(colors)));
    scene.addChild(doc.createNode().setMesh(mesh).setName('Pyramid'));

    await saveGLB(doc, `3d-elementary-pyramid-purple-${today}.glb`);
}

// 6. 주사위 (Dice)
async function generateDice() {
    const doc = createDocument();
    const scene = doc.createScene();

    const size = 1;
    const hs = size / 2;

    // 흰색 큐브
    const white = [0.95, 0.95, 0.95];

    const verts = [
        [-hs, -hs, -hs], [hs, -hs, -hs], [hs, hs, -hs], [-hs, hs, -hs],
        [-hs, -hs, hs], [hs, -hs, hs], [hs, hs, hs], [-hs, hs, hs]
    ];

    const faces = [
        [0, 1, 2, 3], [5, 4, 7, 6], [4, 0, 3, 7],
        [1, 5, 6, 2], [3, 2, 6, 7], [4, 5, 1, 0]
    ];

    const vertices = [];
    const indices = [];
    const colors = [];

    for (const face of faces) {
        const baseIdx = vertices.length / 3;
        for (const vi of face) {
            vertices.push(...verts[vi]);
            colors.push(...white);
        }
        indices.push(baseIdx, baseIdx + 1, baseIdx + 2);
        indices.push(baseIdx, baseIdx + 2, baseIdx + 3);
    }

    const mesh = doc.createMesh();
    mesh.addPrimitive(createPrimitive(doc, new Float32Array(vertices), new Uint16Array(indices), new Float32Array(colors)));
    scene.addChild(doc.createNode().setMesh(mesh).setName('Dice'));

    await saveGLB(doc, `3d-elementary-dice-white-${today}.glb`);
}

// 7. 분수 파이 반쪽 (Fraction Half Pie)
async function generateFractionHalf() {
    const doc = createDocument();
    const scene = doc.createScene();

    const radius = 1;
    const thickness = 0.3;
    const segments = 16;

    const vertices = [];
    const indices = [];
    const colors = [];

    // 주황색 (반쪽)
    const orange = [1.0, 0.5, 0.2];

    // 반원 (0 ~ PI)
    // 윗면
    const topCenterIdx = 0;
    vertices.push(0, thickness / 2, 0);
    colors.push(...orange);

    for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        vertices.push(x, thickness / 2, z);
        colors.push(...orange);
    }

    // 윗면 삼각형
    for (let i = 0; i < segments; i++) {
        indices.push(topCenterIdx, 1 + i, 1 + i + 1);
    }

    // 아랫면
    const bottomCenterIdx = vertices.length / 3;
    vertices.push(0, -thickness / 2, 0);
    colors.push(...orange);

    const bottomStartIdx = vertices.length / 3;
    for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        vertices.push(x, -thickness / 2, z);
        colors.push(...orange);
    }

    // 아랫면 삼각형 (반대 방향)
    for (let i = 0; i < segments; i++) {
        indices.push(bottomCenterIdx, bottomStartIdx + i + 1, bottomStartIdx + i);
    }

    // 곡면 (옆면)
    for (let i = 0; i < segments; i++) {
        const topA = 1 + i;
        const topB = 1 + i + 1;
        const bottomA = bottomStartIdx + i;
        const bottomB = bottomStartIdx + i + 1;

        indices.push(topA, bottomA, bottomB);
        indices.push(topA, bottomB, topB);
    }

    // 평면 옆면 (시작)
    const flat1Base = vertices.length / 3;
    vertices.push(0, thickness / 2, 0);
    vertices.push(radius, thickness / 2, 0);
    vertices.push(radius, -thickness / 2, 0);
    vertices.push(0, -thickness / 2, 0);
    for (let i = 0; i < 4; i++) colors.push(...orange);
    indices.push(flat1Base, flat1Base + 1, flat1Base + 2);
    indices.push(flat1Base, flat1Base + 2, flat1Base + 3);

    // 평면 옆면 (끝)
    const flat2Base = vertices.length / 3;
    vertices.push(0, thickness / 2, 0);
    vertices.push(-radius, thickness / 2, 0);
    vertices.push(-radius, -thickness / 2, 0);
    vertices.push(0, -thickness / 2, 0);
    for (let i = 0; i < 4; i++) colors.push(...orange);
    indices.push(flat2Base, flat2Base + 2, flat2Base + 1);
    indices.push(flat2Base, flat2Base + 3, flat2Base + 2);

    const mesh = doc.createMesh();
    mesh.addPrimitive(createPrimitive(doc, new Float32Array(vertices), new Uint16Array(indices), new Float32Array(colors)));
    scene.addChild(doc.createNode().setMesh(mesh).setName('FractionHalf'));

    await saveGLB(doc, `3d-elementary-fraction-half-orange-${today}.glb`);
}

// 8. 동전 (Coin)
async function generateCoin() {
    const doc = createDocument();
    const scene = doc.createScene();

    const radius = 0.8;
    const thickness = 0.1;
    const segments = 32;

    const vertices = [];
    const indices = [];
    const colors = [];

    // 금색
    const gold = [0.85, 0.65, 0.13];

    // 윗면 중심
    vertices.push(0, thickness / 2, 0);
    colors.push(...gold);

    // 아랫면 중심
    vertices.push(0, -thickness / 2, 0);
    colors.push(...gold);

    // 테두리
    for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        vertices.push(x, thickness / 2, z);
        colors.push(...gold);
        vertices.push(x, -thickness / 2, z);
        colors.push(...gold);
    }

    // 윗면
    for (let i = 0; i < segments; i++) {
        indices.push(0, 2 + i * 2, 2 + (i + 1) * 2);
    }

    // 아랫면
    for (let i = 0; i < segments; i++) {
        indices.push(1, 3 + (i + 1) * 2, 3 + i * 2);
    }

    // 옆면
    for (let i = 0; i < segments; i++) {
        const topA = 2 + i * 2;
        const bottomA = 3 + i * 2;
        const topB = 2 + (i + 1) * 2;
        const bottomB = 3 + (i + 1) * 2;

        indices.push(topA, bottomA, bottomB);
        indices.push(topA, bottomB, topB);
    }

    const mesh = doc.createMesh();
    mesh.addPrimitive(createPrimitive(doc, new Float32Array(vertices), new Uint16Array(indices), new Float32Array(colors)));
    scene.addChild(doc.createNode().setMesh(mesh).setName('Coin'));

    await saveGLB(doc, `3d-elementary-coin-gold-${today}.glb`);
}

// 9. 세기 블록 세트 (Counting Blocks - 5개)
async function generateCountingBlocks() {
    const doc = createDocument();
    const scene = doc.createScene();

    const blockSize = 0.4;
    const gap = 0.1;
    const hs = blockSize / 2;

    const rainbow = [
        [0.9, 0.3, 0.3], // 빨강
        [1.0, 0.6, 0.2], // 주황
        [0.95, 0.9, 0.2], // 노랑
        [0.3, 0.8, 0.4], // 초록
        [0.3, 0.5, 0.9]  // 파랑
    ];

    const verts = [
        [-hs, -hs, -hs], [hs, -hs, -hs], [hs, hs, -hs], [-hs, hs, -hs],
        [-hs, -hs, hs], [hs, -hs, hs], [hs, hs, hs], [-hs, hs, hs]
    ];

    const faces = [
        [0, 1, 2, 3], [5, 4, 7, 6], [4, 0, 3, 7],
        [1, 5, 6, 2], [3, 2, 6, 7], [4, 5, 1, 0]
    ];

    const vertices = [];
    const indices = [];
    const colors = [];

    for (let b = 0; b < 5; b++) {
        const offsetX = b * (blockSize + gap) - 2 * (blockSize + gap);
        const color = rainbow[b];

        for (const face of faces) {
            const baseIdx = vertices.length / 3;
            for (const vi of face) {
                vertices.push(verts[vi][0] + offsetX, verts[vi][1], verts[vi][2]);
                colors.push(...color);
            }
            indices.push(baseIdx, baseIdx + 1, baseIdx + 2);
            indices.push(baseIdx, baseIdx + 2, baseIdx + 3);
        }
    }

    const mesh = doc.createMesh();
    mesh.addPrimitive(createPrimitive(doc, new Float32Array(vertices), new Uint16Array(indices), new Float32Array(colors)));
    scene.addChild(doc.createNode().setMesh(mesh).setName('CountingBlocks'));

    await saveGLB(doc, `3d-elementary-counting-blocks-rainbow-${today}.glb`);
}

// 10. 사과 (Apple) - 간단한 구 기반
async function generateApple() {
    const doc = createDocument();
    const scene = doc.createScene();

    // 본체 (약간 찌그러진 구)
    const radius = 0.8;
    const latSegments = 12;
    const lonSegments = 16;

    const vertices = [];
    const indices = [];
    const colors = [];

    // 빨간색
    const red = [0.85, 0.15, 0.15];

    for (let lat = 0; lat <= latSegments; lat++) {
        const theta = (lat / latSegments) * Math.PI;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);

        // 사과 모양을 위해 y축 방향으로 살짝 찌그러뜨림
        const yScale = 0.85;

        for (let lon = 0; lon <= lonSegments; lon++) {
            const phi = (lon / lonSegments) * Math.PI * 2;
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);

            const x = cosPhi * sinTheta * radius;
            const y = cosTheta * radius * yScale;
            const z = sinPhi * sinTheta * radius;

            vertices.push(x, y, z);
            colors.push(...red);
        }
    }

    const cols = lonSegments + 1;
    for (let lat = 0; lat < latSegments; lat++) {
        for (let lon = 0; lon < lonSegments; lon++) {
            const a = lat * cols + lon;
            const b = a + 1;
            const c = (lat + 1) * cols + lon;
            const d = c + 1;

            indices.push(a, c, b);
            indices.push(b, c, d);
        }
    }

    // 꼭지 (원기둥)
    const stemColor = [0.4, 0.25, 0.1];
    const stemRadius = 0.05;
    const stemHeight = 0.25;
    const stemSegments = 8;
    const stemBaseY = radius * 0.85 - 0.05;

    const stemCenterTop = vertices.length / 3;
    vertices.push(0, stemBaseY + stemHeight, 0);
    colors.push(...stemColor);

    const stemCenterBottom = vertices.length / 3;
    vertices.push(0, stemBaseY, 0);
    colors.push(...stemColor);

    for (let i = 0; i <= stemSegments; i++) {
        const angle = (i / stemSegments) * Math.PI * 2;
        const x = Math.cos(angle) * stemRadius;
        const z = Math.sin(angle) * stemRadius;

        vertices.push(x, stemBaseY + stemHeight, z);
        colors.push(...stemColor);
        vertices.push(x, stemBaseY, z);
        colors.push(...stemColor);
    }

    const stemVertStart = stemCenterBottom + 1;
    for (let i = 0; i < stemSegments; i++) {
        const topIdx = stemVertStart + i * 2;
        const bottomIdx = stemVertStart + i * 2 + 1;
        const topNextIdx = stemVertStart + (i + 1) * 2;
        const bottomNextIdx = stemVertStart + (i + 1) * 2 + 1;

        // 윗면
        indices.push(stemCenterTop, topIdx, topNextIdx);
        // 옆면
        indices.push(topIdx, bottomIdx, bottomNextIdx);
        indices.push(topIdx, bottomNextIdx, topNextIdx);
    }

    const mesh = doc.createMesh();
    mesh.addPrimitive(createPrimitive(doc, new Float32Array(vertices), new Uint16Array(indices), new Float32Array(colors)));
    scene.addChild(doc.createNode().setMesh(mesh).setName('Apple'));

    await saveGLB(doc, `3d-elementary-apple-red-${today}.glb`);
}

// 모든 에셋 생성
(async () => {
    try {
        console.log('초등학교 수학용 3D 에셋 생성 시작...\n');

        await generateSphere();
        await generateCylinder();
        await generateCone();
        await generateBox();
        await generatePyramid();
        await generateDice();
        await generateFractionHalf();
        await generateCoin();
        await generateCountingBlocks();
        await generateApple();

        console.log('\n모든 초등 수학용 3D 에셋 생성 완료!');
    } catch (e) {
        console.error('에러 발생:', e);
    }
})();
