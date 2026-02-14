require('dotenv').config();
var { streamZaiChat } = require('./dist/llm/zai-client');
var { parseZaiOutput } = require('./dist/llm/zai-output');
var { enableLogging } = require('./dist/logger');

enableLogging(true);

var apiKey = process.env.ZAI_API_KEY;
var apiUrl = process.env.ZAI_API_URL;
var model = process.env.ZAI_MODEL || 'glm-4.7';
var moduleId = 'test-module';

console.log('Model:', model);
console.log('API URL:', apiUrl || '(default)');

var messages = [
  {
    role: 'system',
    content: '당신은 한국 교육 콘텐츠를 생성하는 전문가입니다. 항상 한국어로 작성합니다.'
  },
  {
    role: 'user',
    content: [
      '간단한 "1+1=2" 덧셈 학습 콘텐츠를 만들어주세요.',
      '',
      '응답 형식은 마크다운 코드블록으로:',
      '### index.html',
      '```html',
      '...',
      '```',
      '### script.js',
      '```js',
      '...',
      '```',
      '### style.css',
      '```css',
      '...',
      '```',
      '설명 없이 파일만 출력하세요. 각 파일은 최소 100자 이상이어야 합니다.'
    ].join('\n')
  }
];

(async function () {
  try {
    console.log('\n=== Streaming Z.ai API ===\n');
    var content = await streamZaiChat(messages, {
      apiKey: apiKey,
      apiUrl: apiUrl || undefined,
      model: model,
      label: 'TEST'
    });

    console.log('\n=== Raw response (' + content.length + ' chars) ===');
    console.log(content.slice(0, 1000));
    console.log('...\n');

    console.log('=== Parsing output ===');
    var files = parseZaiOutput(content, moduleId);
    console.log('Parsed ' + files.length + ' files:');
    files.forEach(function (f) {
      console.log('  ' + f.path + ' (' + f.content.length + ' chars)');
    });
    console.log('\n=== SUCCESS ===');
  } catch (e) {
    console.error('\n=== FAILED ===');
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
