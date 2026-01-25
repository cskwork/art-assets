/**
 * 정다면체(Platonic Solids) 5종 GLB 파일 생성 스크립트
 * @gltf-transform/core 사용 (Node.js 호환)
 */

import { Document, NodeIO } from '@gltf-transform/core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 정다면체 정점 및 면 데이터
const PLATONIC_SOLIDS = {
  // 정사면체 (4면, 4꼭짓점, 6모서리)
  tetrahedron: {
    korName: '정사면체',
    faces: 4,
    vertices: 4,
    edges: 6,
    // 정규화된 좌표
    positions: new Float32Array([
      1, 1, 1,    // 0
      -1, -1, 1,  // 1
      -1, 1, -1,  // 2
      1, -1, -1   // 3
    ]),
    indices: new Uint16Array([
      0, 1, 2,  // face 1
      0, 3, 1,  // face 2
      0, 2, 3,  // face 3
      1, 3, 2   // face 4
    ]),
    color: [1.0, 0.42, 0.42, 1.0], // 빨간색
  },

  // 정육면체 (6면, 8꼭짓점, 12모서리)
  hexahedron: {
    korName: '정육면체',
    faces: 6,
    vertices: 8,
    edges: 12,
    positions: new Float32Array([
      // Front face
      -1, -1,  1,  1, -1,  1,  1,  1,  1, -1,  1,  1,
      // Back face
      -1, -1, -1, -1,  1, -1,  1,  1, -1,  1, -1, -1,
      // Top face
      -1,  1, -1, -1,  1,  1,  1,  1,  1,  1,  1, -1,
      // Bottom face
      -1, -1, -1,  1, -1, -1,  1, -1,  1, -1, -1,  1,
      // Right face
       1, -1, -1,  1,  1, -1,  1,  1,  1,  1, -1,  1,
      // Left face
      -1, -1, -1, -1, -1,  1, -1,  1,  1, -1,  1, -1,
    ]),
    indices: new Uint16Array([
      0, 1, 2,   0, 2, 3,    // front
      4, 5, 6,   4, 6, 7,    // back
      8, 9, 10,  8, 10, 11,  // top
      12, 13, 14, 12, 14, 15, // bottom
      16, 17, 18, 16, 18, 19, // right
      20, 21, 22, 20, 22, 23  // left
    ]),
    color: [0.31, 0.80, 0.77, 1.0], // 청록색
  },

  // 정팔면체 (8면, 6꼭짓점, 12모서리)
  octahedron: {
    korName: '정팔면체',
    faces: 8,
    vertices: 6,
    edges: 12,
    positions: new Float32Array([
      1, 0, 0,   // 0: +X
      -1, 0, 0,  // 1: -X
      0, 1, 0,   // 2: +Y
      0, -1, 0,  // 3: -Y
      0, 0, 1,   // 4: +Z
      0, 0, -1   // 5: -Z
    ]),
    indices: new Uint16Array([
      0, 2, 4,  // +X, +Y, +Z
      0, 4, 3,  // +X, +Z, -Y
      0, 3, 5,  // +X, -Y, -Z
      0, 5, 2,  // +X, -Z, +Y
      1, 4, 2,  // -X, +Z, +Y
      1, 3, 4,  // -X, -Y, +Z
      1, 5, 3,  // -X, -Z, -Y
      1, 2, 5   // -X, +Y, -Z
    ]),
    color: [1.0, 0.90, 0.43, 1.0], // 노란색
  },

  // 정십이면체 (12면, 20꼭짓점, 30모서리)
  dodecahedron: {
    korName: '정십이면체',
    faces: 12,
    vertices: 20,
    edges: 30,
    positions: (() => {
      const phi = (1 + Math.sqrt(5)) / 2; // 황금비
      const a = 1;
      const b = 1 / phi;
      const c = 2 - phi;

      return new Float32Array([
        // 큐브 꼭짓점 (8개)
        a, a, a,    a, a, -a,   a, -a, a,   a, -a, -a,
        -a, a, a,   -a, a, -a,  -a, -a, a,  -a, -a, -a,
        // XY 평면 직사각형 (4개)
        0, b, phi,  0, b, -phi, 0, -b, phi, 0, -b, -phi,
        // XZ 평면 직사각형 (4개)
        b, phi, 0,  b, -phi, 0, -b, phi, 0, -b, -phi, 0,
        // YZ 평면 직사각형 (4개)
        phi, 0, b,  phi, 0, -b, -phi, 0, b, -phi, 0, -b
      ]);
    })(),
    // 정십이면체는 오각형 면 12개를 삼각형으로 분할
    indices: new Uint16Array([
      // 각 오각형을 삼각형 3개로 분할
      0, 16, 2,   0, 2, 10,   0, 10, 8,
      0, 8, 4,    0, 4, 12,   0, 12, 16,
      16, 17, 3,  16, 3, 2,   16, 2, 0,
      1, 12, 14,  1, 14, 5,   1, 5, 9,
      1, 9, 11,   1, 11, 3,   1, 3, 17,
      1, 17, 16,  1, 16, 12,  1, 12, 14,
      4, 8, 14,   4, 14, 12,  4, 12, 0,
      5, 14, 8,   5, 8, 10,   5, 10, 9,
      6, 10, 2,   6, 2, 13,   6, 13, 15,
      6, 15, 18,  6, 18, 8,   6, 8, 10,
      7, 11, 9,   7, 9, 19,   7, 19, 15,
      7, 15, 13,  7, 13, 3,   7, 3, 11
    ]),
    color: [0.58, 0.88, 0.83, 1.0], // 민트색
  },

  // 정이십면체 (20면, 12꼭짓점, 30모서리)
  icosahedron: {
    korName: '정이십면체',
    faces: 20,
    vertices: 12,
    edges: 30,
    positions: (() => {
      const phi = (1 + Math.sqrt(5)) / 2;
      return new Float32Array([
        0, 1, phi,   0, 1, -phi,  0, -1, phi,  0, -1, -phi,
        1, phi, 0,  -1, phi, 0,   1, -phi, 0, -1, -phi, 0,
        phi, 0, 1,   phi, 0, -1, -phi, 0, 1,  -phi, 0, -1
      ]);
    })(),
    indices: new Uint16Array([
      0, 2, 8,   0, 8, 4,   0, 4, 5,   0, 5, 10,  0, 10, 2,
      3, 1, 9,   3, 9, 6,   3, 6, 7,   3, 7, 11,  3, 11, 1,
      2, 10, 7,  2, 7, 6,   2, 6, 8,
      8, 6, 9,   8, 9, 4,
      4, 9, 1,   4, 1, 5,
      5, 1, 11,  5, 11, 10,
      10, 11, 7
    ]),
    color: [0.87, 0.63, 0.87, 1.0], // 보라색
  }
};

// 법선 벡터 계산 함수
function computeNormals(positions, indices) {
  const normals = new Float32Array(positions.length);

  for (let i = 0; i < indices.length; i += 3) {
    const i0 = indices[i] * 3;
    const i1 = indices[i + 1] * 3;
    const i2 = indices[i + 2] * 3;

    // 삼각형 정점
    const v0 = [positions[i0], positions[i0 + 1], positions[i0 + 2]];
    const v1 = [positions[i1], positions[i1 + 1], positions[i1 + 2]];
    const v2 = [positions[i2], positions[i2 + 1], positions[i2 + 2]];

    // 두 변 벡터
    const edge1 = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]];
    const edge2 = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]];

    // 외적 (법선)
    const nx = edge1[1] * edge2[2] - edge1[2] * edge2[1];
    const ny = edge1[2] * edge2[0] - edge1[0] * edge2[2];
    const nz = edge1[0] * edge2[1] - edge1[1] * edge2[0];

    // 법선 누적
    normals[i0] += nx; normals[i0 + 1] += ny; normals[i0 + 2] += nz;
    normals[i1] += nx; normals[i1 + 1] += ny; normals[i1 + 2] += nz;
    normals[i2] += nx; normals[i2 + 1] += ny; normals[i2 + 2] += nz;
  }

  // 법선 정규화
  for (let i = 0; i < normals.length; i += 3) {
    const len = Math.sqrt(normals[i] ** 2 + normals[i + 1] ** 2 + normals[i + 2] ** 2);
    if (len > 0) {
      normals[i] /= len;
      normals[i + 1] /= len;
      normals[i + 2] /= len;
    }
  }

  return normals;
}

// GLB 파일 생성
async function generateGLB(name, solid, outputPath) {
  const doc = new Document();
  const buffer = doc.createBuffer();

  // 정점 위치 정규화 (크기 조정)
  const normalizedPositions = new Float32Array(solid.positions.length);
  for (let i = 0; i < solid.positions.length; i++) {
    normalizedPositions[i] = solid.positions[i] * 0.5;
  }

  // 법선 계산
  const normals = computeNormals(normalizedPositions, solid.indices);

  // Position Accessor
  const positionAccessor = doc.createAccessor()
    .setType('VEC3')
    .setArray(normalizedPositions)
    .setBuffer(buffer);

  // Normal Accessor
  const normalAccessor = doc.createAccessor()
    .setType('VEC3')
    .setArray(normals)
    .setBuffer(buffer);

  // Index Accessor
  const indexAccessor = doc.createAccessor()
    .setType('SCALAR')
    .setArray(solid.indices)
    .setBuffer(buffer);

  // Material (PBR)
  const material = doc.createMaterial(solid.korName + '_material')
    .setBaseColorFactor(solid.color)
    .setMetallicFactor(0.1)
    .setRoughnessFactor(0.5);

  // Primitive
  const primitive = doc.createPrimitive()
    .setIndices(indexAccessor)
    .setAttribute('POSITION', positionAccessor)
    .setAttribute('NORMAL', normalAccessor)
    .setMaterial(material);

  // Mesh
  const mesh = doc.createMesh(solid.korName)
    .addPrimitive(primitive);

  // Node
  const node = doc.createNode(solid.korName)
    .setMesh(mesh);

  // Scene
  const scene = doc.createScene(solid.korName + '_scene')
    .addChild(node);

  doc.getRoot().setDefaultScene(scene);

  // 저장
  const io = new NodeIO();
  await io.write(outputPath, doc);

  console.log(`Generated: ${path.basename(outputPath)}`);
  console.log(`  - ${solid.korName}: 면 ${solid.faces}개, 꼭짓점 ${solid.vertices}개, 모서리 ${solid.edges}개`);
}

// 메인 실행
async function main() {
  console.log('========================================');
  console.log('정다면체(Platonic Solids) 5종 GLB 생성');
  console.log('========================================\n');

  const outputDir = path.join(__dirname, '..', '3d');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const generatedAssets = [];

  for (const [name, solid] of Object.entries(PLATONIC_SOLIDS)) {
    const filename = `3d-${name}-math-${today}.glb`;
    const outputPath = path.join(outputDir, filename);

    try {
      await generateGLB(name, solid, outputPath);
      generatedAssets.push({
        id: `3d-${name}-math-${today}`,
        path: `3d/${filename}`,
        category: '3d',
        tags: ['3d', 'platonic-solid', 'geometry', 'high-school', 'math', solid.korName],
        description: `${solid.korName} 3D 모델 (면: ${solid.faces}, 꼭짓점: ${solid.vertices}, 모서리: ${solid.edges})`,
        format: 'glb',
        addedDate: new Date().toISOString().slice(0, 10),
      });
    } catch (error) {
      console.error(`Error generating ${filename}:`, error.message);
    }
  }

  console.log('\n========================================');
  console.log('assets.json에 추가할 항목:');
  console.log('========================================\n');

  for (const asset of generatedAssets) {
    console.log(JSON.stringify(asset, null, 2) + ',');
  }

  console.log('\n완료!');
}

main().catch(console.error);
